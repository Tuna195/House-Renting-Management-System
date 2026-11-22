import type { Contract, ContractInput, ContractStatus } from '../types';
import { api } from './client';

interface ContractListParams {
  status?: ContractStatus;
  buildingId?: number;
}

export const contractsApi = {
  list: (params: ContractListParams = {}) => api.get<Contract[]>('/contracts', { params }).then((r) => r.data),
  create: (data: ContractInput) => api.post<Contract>('/contracts', data).then((r) => r.data),
  end: (id: number, endDate: string) => api.post<Contract>(`/contracts/${id}/end`, { endDate }).then((r) => r.data),
  remove: (id: number) => api.delete(`/contracts/${id}`),
};
