import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';

export interface NotifyInput {
  title: string;
  body: string;
  link?: string;
}

/**
 * 🔔 HÀM DÙNG CHUNG CHO CẢ NHÓM:
 * Gửi thông báo đến một người dùng cụ thể.
 * Lưu vào Database bảng `Notification`.
 * Đến Tuần 9, hàm này sẽ tự động gắn thêm Web Push và Socket.IO Realtime.
 */
export async function notify(userId: number, data: NotifyInput) {
  return prisma.notification.create({
    data: {
      userId,
      title: data.title,
      body: data.body,
      link: data.link || null,
    },
  });
}

/**
 * Lấy 20 thông báo mới nhất của người dùng hiện tại và đếm số lượng chưa đọc.
 */
export async function listMyNotifications(userId: number) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    }),
  ]);

  return { items, unreadCount };
}

/**
 * Đánh dấu một thông báo cụ thể là đã đọc.
 */
export async function markAsRead(userId: number, notificationId: number) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError(404, 'Không tìm thấy thông báo hoặc bạn không có quyền');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc.
 */
export async function markAllAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}
