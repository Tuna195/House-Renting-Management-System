// ⭐ MẪU file API — rooms.ts, tenants.ts... viết y hệt
import type { Building, BuildingInput } from '../types';
import { api } from './client';

export const buildingsApi = {
  list: () => api.get<Building[]>('/buildings').then((r) => r.data),
  get: (id: number) => api.get<Building>(`/buildings/${id}`).then((r) => r.data),
  create: (data: BuildingInput) => api.post<Building>('/buildings', data).then((r) => r.data),
  update: (id: number, data: Partial<BuildingInput>) =>
    api.patch<Building>(`/buildings/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/buildings/${id}`),
};
