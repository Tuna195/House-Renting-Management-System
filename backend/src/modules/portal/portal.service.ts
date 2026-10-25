import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import type { CreateMaintenanceInput } from './portal.schema';

/**
 * Lấy hợp đồng đang hiệu lực của khách (trả về null nếu chưa có, không throw lỗi).
 * Dùng để frontend hiển thị thông tin phòng hoặc cảnh báo nếu chưa được xếp phòng.
 */
export async function findActiveContractOfUser(userId: number) {
  return prisma.contract.findFirst({
    where: {
      status: 'ACTIVE',
      tenants: {
        some: {
          tenant: { userId },
        },
      },
    },
    include: {
      room: {
        include: { building: true },
      },
    },
  });
}

/**
 * Tìm hợp đồng đang hiệu lực (ACTIVE) của người dùng khách thuê (ném lỗi 400 nếu không có).
 * Hàm này dùng chung cho toàn bộ cổng khách thuê (sự cố, hóa đơn, thông tin phòng...).
 */
export async function getActiveContractOfUser(userId: number) {
  const contract = await findActiveContractOfUser(userId);

  if (!contract) {
    throw new AppError(400, 'Bạn chưa có hợp đồng thuê đang hiệu lực');
  }

  return contract;
}

/**
 * Lấy danh sách các yêu cầu sửa chữa do khách này gửi, mới nhất lên đầu.
 */
export async function listMyMaintenance(userId: number) {
  return prisma.maintenanceRequest.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          building: {
            select: { id: true, name: true, address: true },
          },
        },
      },
    },
  });
}

/**
 * Tạo yêu cầu sửa chữa mới.
 * Phòng được tự động lấy từ hợp đồng ACTIVE của user (bảo mật tuyệt đối, không nhận roomId từ client).
 */
export async function createMaintenance(userId: number, input: CreateMaintenanceInput) {
  const contract = await getActiveContractOfUser(userId);

  return prisma.maintenanceRequest.create({
    data: {
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl || null,
      roomId: contract.roomId,
      createdById: userId,
      status: 'OPEN',
    },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          building: {
            select: { id: true, name: true, address: true },
          },
        },
      },
    },
  });
}
