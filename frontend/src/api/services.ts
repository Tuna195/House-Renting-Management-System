import type { Service } from '../types';
import { api } from './client';

export const servicesApi = {
  list: (buildingId: number) =>
    api.get<Service[]>('/services', { params: { buildingId } }).then((r) => r.data),
};
