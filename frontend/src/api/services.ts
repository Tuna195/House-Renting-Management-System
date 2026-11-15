import type { Service, ServiceArchivedResult, ServiceInput, ServiceUpdateInput } from '../types';
import { api } from './client';

export const servicesApi = {
  list: (buildingId?: number) => api.get<Service[]>('/services', { params: { buildingId } }).then((r) => r.data),
  get: (id: number) => api.get<Service>(`/services/${id}`).then((r) => r.data),
  create: (data: ServiceInput) => api.post<Service>('/services', data).then((r) => r.data),
  update: (id: number, data: ServiceUpdateInput) => api.patch<Service>(`/services/${id}`, data).then((r) => r.data),
  // 204 (xóa hẳn) → trả về null; 200 (đã dùng trong hợp đồng nên chỉ ẩn) → { archived: true, service }
  remove: (id: number) =>
    api.delete<ServiceArchivedResult | ''>(`/services/${id}`).then((r) => (r.status === 204 ? null : r.data || null)),
};
