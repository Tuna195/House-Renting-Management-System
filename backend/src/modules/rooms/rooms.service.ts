import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../utils/app-error';
import { getBuilding } from '../buildings/buildings.service';
import type { CreateRoomInput, ListRoomsQuery, UpdateRoomInput } from './rooms.schema';

// Phòng KHÔNG có ownerId → kiểm tra quyền gián tiếp qua tòa nhà: room.building.ownerId.
// Mọi truy vấn đều phải có điều kiện `building: { ownerId }`.

export function listRooms(ownerId: number, query: ListRoomsQuery) {
  return prisma.room.findMany({
    where: {
      building: { ownerId },
      ...(query.buildingId && { buildingId: query.buildingId }),
      ...(query.status && { status: query.status }),
    },
    orderBy: [{ buildingId: 'asc' }, { name: 'asc' }],
    include: { building: { select: { id: true, name: true } } },
  });
}

export async function getRoom(ownerId: number, id: number) {
  const room = await prisma.room.findFirst({
    where: { id, building: { ownerId } },
    include: {
      building: { select: { id: true, name: true } },
      // Hợp đồng đang hiệu lực (nếu có) kèm danh sách người ở
      contracts: {
        where: { status: 'ACTIVE' },
        include: { tenants: { include: { tenant: { select: { id: true, fullName: true, phone: true } } } } },
      },
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
