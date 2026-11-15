import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../utils/app-error';
import { getBuilding } from '../buildings/buildings.service';
import type { CreateRoomInput, ListRoomsQuery, UpdateRoomInput } from './rooms.schema';

// Phòng KHÔNG có ownerId → kiểm tra quyền gián tiếp qua tòa nhà: room.building.ownerId.
// Mọi truy vấn đều phải có điều kiện `building: { ownerId }`.

// Hóa đơn đã phát hành, chưa thu đủ và đã qua hạn đóng → "quá hạn".
// Schema không có trạng thái OVERDUE riêng: quá hạn = UNPAID/PARTIAL + dueDate < hiện tại.
const overdueInvoiceWhere = () => ({
  status: { in: ['UNPAID' as const, 'PARTIAL' as const] },
  dueDate: { lt: new Date() },
});

export async function listRooms(ownerId: number, query: ListRoomsQuery) {
  const where = {
    building: { ownerId },
    ...(query.buildingId && { buildingId: query.buildingId }),
    ...(query.status && { status: query.status }),
  };

  const [rooms, overdue] = await Promise.all([
    prisma.room.findMany({
      where,
      orderBy: [{ buildingId: 'asc' }, { name: 'asc' }],
      include: {
        building: { select: { id: true, name: true } },
        // Người đại diện của hợp đồng đang hiệu lực (dùng cho Sơ đồ phòng và bảng Phòng)
        contracts: {
          where: { status: 'ACTIVE' },
          select: {
            tenants: {
              where: { isPrimary: true },
              select: { tenant: { select: { id: true, fullName: true, phone: true } } },
            },
          },
        },
      },
    }),
    // Một truy vấn lấy luôn các phòng có hóa đơn quá hạn (kể cả của hợp đồng cũ chưa trả hết)
    prisma.invoice.findMany({
      where: { ...overdueInvoiceWhere(), contract: { room: where } },
      select: { contract: { select: { roomId: true } } },
    }),
  ]);

  const overdueRoomIds = new Set(overdue.map((i) => i.contract.roomId));
  return rooms.map(({ contracts, ...room }) => ({
    ...room,
    primaryTenant: contracts[0]?.tenants[0]?.tenant ?? null,
    hasOverdueInvoice: overdueRoomIds.has(room.id),
  }));
}

export async function getRoom(ownerId: number, id: number) {
  const room = await prisma.room.findFirst({
    where: { id, building: { ownerId } },
    include: {
      building: { select: { id: true, name: true, address: true } },
      // Hợp đồng đang hiệu lực (nếu có) kèm danh sách người ở và dịch vụ đang dùng
      contracts: {
        where: { status: 'ACTIVE' },
        include: {
          tenants: {
            orderBy: { isPrimary: 'desc' }, // người đại diện lên đầu
            include: { tenant: { select: { id: true, fullName: true, phone: true } } },
          },
          services: { include: { service: true } },
        },
      },
      // 6 kỳ chỉ số gần nhất ("YYYY-MM" sắp xếp theo chuỗi đúng thứ tự thời gian)
      meterReadings: { orderBy: { period: 'desc' }, take: 6 },
      _count: { select: { contracts: true } },
    },
  });
  if (!room) throw notFound('phòng');

  const { contracts, ...rest } = room;
  return { ...rest, currentContract: contracts[0] ?? null };
}

// Báo lỗi dễ hiểu thay vì lỗi P2002 chung chung "Dữ liệu bị trùng"
async function ensureNameAvailable(buildingId: number, name: string, exceptId?: number) {
  const existing = await prisma.room.findFirst({
    where: { buildingId, name, ...(exceptId && { NOT: { id: exceptId } }) },
  });
  if (existing) throw new AppError(409, 'Tên phòng đã tồn tại trong tòa nhà này');
}

export async function createRoom(ownerId: number, input: CreateRoomInput) {
  await getBuilding(ownerId, input.buildingId); // tòa nhà phải là của mình, không thì 404
  await ensureNameAvailable(input.buildingId, input.name);
  return prisma.room.create({ data: input });
}

export async function updateRoom(ownerId: number, id: number, input: UpdateRoomInput) {
  const room = await getRoom(ownerId, id);
  if (input.name && input.name !== room.name) {
    await ensureNameAvailable(room.buildingId, input.name, id);
  }
  if (input.status && room.status === 'OCCUPIED') {
    throw new AppError(409, 'Phòng đang có người thuê, không thể đổi trạng thái');
  }
  return prisma.room.update({ where: { id }, data: input });
}

export async function deleteRoom(ownerId: number, id: number) {
  const room = await getRoom(ownerId, id);
  if (room._count.contracts > 0) {
    throw new AppError(409, 'Phòng đã từng có hợp đồng, không thể xóa');
  }
  await prisma.room.delete({ where: { id } });
}
