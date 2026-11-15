/** Kiểu dữ liệu và lời gọi HTTP dùng chung cho trang nhập chỉ số điện nước. */
import { api } from './client';
/** Một dòng chỉ số gửi khi lưu; cùng cấu trúc chỉ số được dùng để hiển thị dữ liệu đã đọc. */
export interface Reading { roomId: number; electricStart: number; electricEnd: number; waterStart: number; waterEnd: number }
/** Phòng cùng dữ liệu kỳ hiện tại, lịch sử gần nhất và quyền chỉnh sửa do backend xác định. */
export interface MeterRow { room: { id: number; name: string }; current: Reading | null; previous: Reading | null; locked: boolean }
export const meterApi = {
  /** Lấy bảng chỉ số theo tòa nhà và tháng, trả trực tiếp phần dữ liệu của response. */
  list: (buildingId: number, period: string) => api.get<MeterRow[]>('/meter-readings', { params: { buildingId, period } }).then((r) => r.data),
  /** Gửi toàn bộ các dòng cần lưu trong một request; trả promise của HTTP response. */
  save: (buildingId: number, period: string, readings: Reading[]) => api.put('/meter-readings/bulk', { buildingId, period, readings }),
};
