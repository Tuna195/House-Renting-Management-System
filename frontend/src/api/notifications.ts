import { api } from './client';
import type { NotificationItem, NotificationListResponse } from '../types';

export const notificationsApi = {
  list: async (): Promise<NotificationListResponse> => {
    const res = await api.get<NotificationListResponse>('/notifications');
    return res.data;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const res = await api.post<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const res = await api.post<{ message: string; count: number }>('/notifications/read-all');
    return res.data;
  },
};
