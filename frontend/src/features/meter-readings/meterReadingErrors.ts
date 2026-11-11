/** Đọc lỗi API từ dữ liệu unknown; chỉ ánh xạ path hợp lệ về snapshot request đã gửi. */
import axios from 'axios';
import { getErrorMessage } from '../../api/client';
import type { Reading } from '../../api/meter-readings';
import { READING_FIELDS, type ReadingField } from './meterReadings.utils';

export type MeterFieldErrors = Record<number, Partial<Record<ReadingField, string>>>;
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Phân biệt lỗi từng ô với lỗi request; không tin kiểu response do Axios generic khai báo. */
export function readMeterError(error: unknown, readings: Reading[]) {
  const fields: MeterFieldErrors = {};
  const data: unknown = axios.isAxiosError(error) ? error.response?.data : undefined;
  const code = isRecord(data) && typeof data.code === 'string' ? data.code : undefined;
  if (isRecord(data) && Array.isArray(data.details)) {
    for (const detail of data.details) {
      if (!isRecord(detail) || !Array.isArray(detail.path) || typeof detail.message !== 'string') continue;
      const [root, index, field] = detail.path;
      if (root !== 'readings' || typeof index !== 'number' || !Number.isInteger(index) || index < 0) continue;
      const room = readings[index];
      const knownField = READING_FIELDS.find((item) => item.field === field)?.field;
      if (!room || !knownField) continue;
      fields[room.roomId] = { ...fields[room.roomId], [knownField]: detail.message };
    }
  }
  return { fields, code, message: getErrorMessage(error) };
}
