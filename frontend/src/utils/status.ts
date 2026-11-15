// Nhãn và màu Tag cho các trạng thái — dùng chung cho mọi trang để hiển thị thống nhất.
// Thêm trạng thái của module khác (sự cố, hóa đơn...) vào cuối file này.
import type { RoomStatus, ServiceUnit } from '../types';

interface StatusDisplay {
  label: string;
  color: string; // tên màu preset của Ant Design Tag
}

export const ROOM_STATUS: Record<RoomStatus, StatusDisplay> = {
  VACANT: { label: 'Trống', color: 'green' },
  OCCUPIED: { label: 'Đang thuê', color: 'blue' },
  MAINTENANCE: { label: 'Sửa chữa', color: 'orange' },
};

/** Dùng cho Select lọc trạng thái: [{ value: 'VACANT', label: 'Trống' }, ...] */
export const ROOM_STATUS_OPTIONS = (Object.keys(ROOM_STATUS) as RoomStatus[]).map((value) => ({
  value,
  label: ROOM_STATUS[value].label,
}));
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

// -----------------------------------------------------------------------------
// TV1 — Đơn vị tính dịch vụ
// -----------------------------------------------------------------------------

interface ServiceUnitDisplay {
  label: string; // tên đầy đủ, dùng trong Select
  suffix: string; // hậu tố sau giá: "50.000 ₫/phòng"
}

export const SERVICE_UNIT: Record<ServiceUnit, ServiceUnitDisplay> = {
  PER_ROOM: { label: 'Theo phòng', suffix: '/phòng' },
  PER_PERSON: { label: 'Theo người', suffix: '/người' },
  PER_QUANTITY: { label: 'Theo số lượng (VD: xe)', suffix: '/xe (số lượng)' },
};

export const SERVICE_UNIT_OPTIONS = (Object.keys(SERVICE_UNIT) as ServiceUnit[]).map((value) => ({
  value,
  label: `${SERVICE_UNIT[value].label} — ${SERVICE_UNIT[value].suffix}`,
}));
