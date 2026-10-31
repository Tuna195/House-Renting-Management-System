import { MaintenanceStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { notify } from '../notifications/notifications.service';

/**
 * Ma trận chuyển đổi trạng thái hợp lệ (State Machine):
 * - OPEN ➔ IN_PROGRESS (Tiếp nhận) hoặc REJECTED (Từ chối)
 * - IN_PROGRESS ➔ DONE (Đã sửa xong) hoặc REJECTED (Hủy/Từ chối)
 * - DONE / REJECTED ➔ Không được chuyển tiếp nữa
 */
const NEXT_STATUS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['DONE', 'REJECTED'],
  DONE: [],
  REJECTED: [],
};

const STATUS_TEXT: Record<MaintenanceStatus, string> = {
  OPEN: 'Chờ duyệt',
  IN_PROGRESS: 'đang được xử lý',
  DONE: 'đã hoàn thành',
  REJECTED: 'đã bị từ chối',
};

/**
 * Lấy danh sách toàn bộ sự cố thuộc các tòa nhà của chủ nhà.
 * Hỗ trợ lọc theo trạng thái (OPEN, IN_PROGRESS, DONE, REJECTED) và theo tòa nhà.
 */
export async function listMaintenance(
  ownerId: number,
  options?: { status?: MaintenanceStatus; buildingId?: number },
) {
  return prisma.maintenanceRequest.findMany({
    where: {
      room: {
        building: {
          ownerId,
          ...(options?.buildingId ? { id: options.buildingId } : {}),
        },
      },
      ...(options?.status ? { status: options.status } : {}),
    },
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
      createdBy: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Chủ nhà cập nhật trạng thái của một sự cố.
 * Kiểm tra phân quyền sở hữu và quy tắc chuyển trạng thái.
 * Tự động gửi thông báo đến khách thuê báo sự cố đó.
 */
export async function updateMaintenanceStatus(
  ownerId: number,
  id: number,
  nextStatus: MaintenanceStatus,
) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      room: {
        include: { building: true },
      },
      createdBy: true,
    },
  });

  if (!request) {
    throw new AppError(404, 'Không tìm thấy yêu cầu sự cố');
  }

  // Đảm bảo sự cố này thuộc tòa nhà do chủ nhà sở hữu
  if (request.room.building.ownerId !== ownerId) {
    throw new AppError(403, 'Bạn không có quyền quản lý sự cố của phòng này');
  }

  const currentStatus = request.status;

  // Kiểm tra quy tắc chuyển trạng thái hợp lệ
  const allowedTransitions = NEXT_STATUS[currentStatus] || [];
  if (!allowedTransitions.includes(nextStatus)) {
    throw new AppError(
      400,
      `Không thể chuyển trạng thái từ "${STATUS_TEXT[currentStatus]}" sang "${STATUS_TEXT[nextStatus]}"`,
    );
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: nextStatus,
      // Nếu hoàn thành thì cập nhật thời điểm xử lý xong
      ...(nextStatus === 'DONE' ? { resolvedAt: new Date() } : {}),
    },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          building: {
            select: { id: true, name: true },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
  });

  // 🔔 Tự động kích hoạt thông báo gửi cho khách thuê
  try {
    let bodyText = `Yêu cầu "${request.title}" của bạn ${STATUS_TEXT[nextStatus]}.`;
    if (nextStatus === 'IN_PROGRESS') {
      bodyText = `Yêu cầu "${request.title}" đã được tiếp nhận và đang xếp thợ xử lý.`;
    } else if (nextStatus === 'DONE') {
      bodyText = `Yêu cầu "${request.title}" đã sửa xong. Vui lòng kiểm tra lại tại phòng!`;
    }

    await notify(request.createdById, {
      title: `🛠️ Cập nhật sự cố phòng ${request.room.name}`,
      body: bodyText,
      link: '/portal/maintenance',
    });
  } catch (err) {
    // Không làm gián đoạn API chính nếu thông báo gặp sự cố
    console.error('Lỗi gửi thông báo cho khách thuê:', err);
  }

  return updated;
}
