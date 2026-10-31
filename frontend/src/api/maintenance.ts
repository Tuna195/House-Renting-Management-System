import { api } from './client';
import type { MaintenanceRequest, MaintenanceStatus } from '../types';

export const maintenanceApi = {
  list: async (params?: {
    status?: MaintenanceStatus | 'ALL';
    buildingId?: number;
  }): Promise<MaintenanceRequest[]> => {
    const queryParams: Record<string, string | number> = {};
    if (params?.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }
    if (params?.buildingId) {
      queryParams.buildingId = params.buildingId;
    }

    const res = await api.get<MaintenanceRequest[]>('/maintenance', { params: queryParams });
    return res.data;
  },

  updateStatus: async (
    id: number,
    status: 'IN_PROGRESS' | 'DONE' | 'REJECTED',
  ): Promise<MaintenanceRequest> => {
    const res = await api.patch<MaintenanceRequest>(`/maintenance/${id}`, { status });
    return res.data;
  },
};
