import { api } from './client';
import type { CreateMaintenanceInput, MaintenanceRequest } from '../types';

export const portalApi = {
  // Lấy danh sách sự cố của khách đang đăng nhập
  listMaintenance: () =>
    api.get<MaintenanceRequest[]>('/portal/maintenance').then((r) => r.data),

  // Gửi báo sự cố mới
  createMaintenance: (data: CreateMaintenanceInput) =>
    api.post<MaintenanceRequest>('/portal/maintenance', data).then((r) => r.data),

  // Lấy hợp đồng đang hiệu lực của khách (trả về null nếu chưa có)
  getActiveContract: () =>
    api.get<import('../types').ActiveContract | null>('/portal/contract/active').then((r) => r.data),
};
