// ⭐ API Khách thuê — Dựa trên mẫu buildings.ts
import type { Tenant, TenantInput } from '../types';
import { api } from './client';

// Định nghĩa kiểu cho tham số tìm kiếm (nếu cần mở rộng thêm phân trang sau này)
interface ListTenantsParams {
  q?: string;
}

interface CreateAccountInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export const tenantsApi = {
  list: (params?: ListTenantsParams) => api.get<Tenant[]>('/tenants', { params }).then((r) => r.data),

  get: (id: number) => api.get<Tenant>(`/tenants/${id}`).then((r) => r.data),

  create: (data: TenantInput) => api.post<Tenant>('/tenants', data).then((r) => r.data),

  update: (id: number, data: Partial<TenantInput>) => api.patch<Tenant>(`/tenants/${id}`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/tenants/${id}`),

  createAccount: (id: number, data: CreateAccountInput) => api.post(`/tenants/${id}/account`, data).then((r) => r.data),
};
