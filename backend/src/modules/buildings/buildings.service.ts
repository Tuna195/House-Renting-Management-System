import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../utils/app-error';
import type { CreateBuildingInput, UpdateBuildingInput } from './buildings.schema';

// QUY TẮC BẢO MẬT QUAN TRỌNG: mọi truy vấn đều lọc theo ownerId.
// Nếu chỉ tìm theo id, chủ nhà A có thể xem/sửa tòa nhà của chủ nhà B bằng cách đổi số trên URL.

export function listBuildings(ownerId: number) {
  return prisma.building.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { rooms: true } } },
  });
}

export async function getBuilding(ownerId: number, id: number) {
  const building = await prisma.building.findFirst({
    where: { id, ownerId },
    include: { _count: { select: { rooms: true } } },
  });
  if (!building) throw notFound('tòa nhà');
  return building;
}

export function createBuilding(ownerId: number, input: CreateBuildingInput) {
  return prisma.building.create({ data: { ...input, ownerId } });
}

export async function updateBuilding(ownerId: number, id: number, input: UpdateBuildingInput) {
  await getBuilding(ownerId, id); // đảm bảo tòa nhà tồn tại VÀ thuộc về chủ nhà này
  return prisma.building.update({ where: { id }, data: input });
}

export async function deleteBuilding(ownerId: number, id: number) {
  const building = await getBuilding(ownerId, id);
  if (building._count.rooms > 0) {
    throw new AppError(409, 'Tòa nhà vẫn còn phòng, hãy xóa các phòng trước');
  }
  await prisma.$transaction([
    prisma.service.deleteMany({ where: { buildingId: id } }),
    prisma.building.delete({ where: { id } }),
  ]);
}
