import type { Room, RoomInput, RoomStatus, RoomUpdateInput } from '../types';
import { api } from './client';

export interface RoomListParams {
  buildingId?: number;
  status?: RoomStatus;
}

export const roomsApi = {
  // axios tự bỏ các tham số undefined → không lọc thì không gửi lên
  list: (params: RoomListParams = {}) => api.get<Room[]>('/rooms', { params }).then((r) => r.data),
  get: (id: number) => api.get<Room>(`/rooms/${id}`).then((r) => r.data),
  create: (data: RoomInput) => api.post<Room>('/rooms', data).then((r) => r.data),
  update: (id: number, data: RoomUpdateInput) => api.patch<Room>(`/rooms/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/rooms/${id}`),
};
