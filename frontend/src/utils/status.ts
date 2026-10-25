import type { MaintenanceStatus } from '../types';

export interface StatusConfig {
  label: string;
  color: string;
  badgeStatus: 'default' | 'success' | 'processing' | 'error' | 'warning';
}

export const maintenanceStatusMap: Record<MaintenanceStatus, StatusConfig> = {
  OPEN: {
    label: 'Chờ tiếp nhận',
    color: 'gold',
    badgeStatus: 'warning',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    color: 'blue',
    badgeStatus: 'processing',
  },
  DONE: {
    label: 'Hoàn thành',
    color: 'green',
    badgeStatus: 'success',
  },
  REJECTED: {
    label: 'Từ chối',
    color: 'red',
    badgeStatus: 'error',
  },
};
