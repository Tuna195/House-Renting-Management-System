import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../utils/app-error';
import { getBuilding } from '../buildings/buildings.service';
import type { CreateServiceInput, ListServicesQuery, UpdateServiceInput } from './services.schema';

// Dịch vụ KHÔNG có ownerId → kiểm tra quyền gián tiếp qua tòa nhà: service.building.ownerId.
// Mọi truy vấn đều phải có điều kiện `building: { ownerId }`.

// Đếm số hợp đồng đang dùng dịch vụ → frontend biết khi xóa sẽ là "ẩn" hay "xóa hẳn"
const withUsage = { _count: { select: { contractServices: true } } } as const;

export function listServices(ownerId: number, query: ListServicesQuery) {
  return prisma.service.findMany({
    where: {
      building: { ownerId },
      ...(query.buildingId && { buildingId: query.buildingId }),
    },
    // Dịch vụ đang dùng lên trước, dịch vụ đã ẩn xuống cuối
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: withUsage,
  });
}

export async function getService(ownerId: number, id: number) {
  const service = await prisma.service.findFirst({
    where: { id, building: { ownerId } },
    include: withUsage,
  });
  if (!service) throw notFound('dịch vụ');
  return service;
}

// Không cho 2 dịch vụ ĐANG DÙNG trùng tên trong một tòa nhà.
// Dịch vụ đã ẩn thì bỏ qua, để chủ nhà tạo lại "Wifi" với giá mới sau khi ẩn "Wifi" cũ.
async function ensureNameAvailable(buildingId: number, name: string, exceptId?: number) {
  const existing = await prisma.service.findFirst({
    where: {
      buildingId,
      isActive: true,
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId && { NOT: { id: exceptId } }),
    },
  });
  if (existing) throw new AppError(409, 'Tòa nhà đã có dịch vụ cùng tên đang hoạt động');
}

export async function createService(ownerId: number, input: CreateServiceInput) {
  await getBuilding(ownerId, input.buildingId); // tòa nhà phải là của mình, không thì 404
  if (input.isActive) await ensureNameAvailable(input.buildingId, input.name);
  return prisma.service.create({ data: input, include: withUsage });
}

export async function updateService(ownerId: number, id: number, input: UpdateServiceInput) {
  const service = await getService(ownerId, id);
  // Kiểm tra trùng tên khi đổi tên, hoặc khi bật lại một dịch vụ đã ẩn
  const name = input.name ?? service.name;
  const willBeActive = input.isActive ?? service.isActive;
  if (willBeActive && (name.toLowerCase() !== service.name.toLowerCase() || !service.isActive)) {
    await ensureNameAvailable(service.buildingId, name, id);
  }
  return prisma.service.update({ where: { id }, data: input, include: withUsage });
}

/**
 * Xóa dịch vụ.
 * - Chưa hợp đồng nào dùng → xóa hẳn, trả về `{ archived: false }`.
 * - Đã có hợp đồng dùng → KHÔNG xóa, chỉ ẩn (`isActive = false`), trả về `{ archived: true, service }`.
 *   Lý do: hợp đồng cũ vẫn tham chiếu dịch vụ này (khóa ngoại ContractService), và hóa đơn
 *   các kỳ trước phải giữ nguyên được nguồn gốc khoản thu. Ẩn đi thì không gắn được vào hợp đồng mới nữa.
 */
export async function deleteService(ownerId: number, id: number) {
  const service = await getService(ownerId, id);
  if (service._count.contractServices > 0) {
    const archived = await prisma.service.update({ where: { id }, data: { isActive: false }, include: withUsage });
    return { archived: true as const, service: archived };
  }
  // Nếu giữa lúc kiểm tra và xóa có hợp đồng mới gắn vào, Prisma báo P2003 → errorHandler trả 409
  await prisma.service.delete({ where: { id } });
  return { archived: false as const };
}
