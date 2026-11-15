import type { Request, Response } from 'express';
import * as notificationService from './notifications.service';

export async function list(req: Request, res: Response) {
  const result = await notificationService.listMyNotifications(req.user!.id);
  res.json(result);
}

export async function markRead(req: Request, res: Response) {
  const notificationId = Number(req.params.id);
  const updated = await notificationService.markAsRead(req.user!.id, notificationId);
  res.json(updated);
}

export async function markAllRead(req: Request, res: Response) {
  const result = await notificationService.markAllAsRead(req.user!.id);
  res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc', count: result.count });
}
