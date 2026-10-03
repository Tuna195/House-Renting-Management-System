import type { AuthResponse, User } from '../types';
import { api } from './client';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
};
