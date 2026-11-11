/** Validate query và body của API chỉ số trước khi chạy nghiệp vụ hoặc mở transaction. */
import { z } from 'zod';
import { databaseIdSchema, httpIdSchema } from '../../validation/id.schema';
import { calculateUsage } from '../billing/billing';

// Giới hạn ID và chỉ số trong phạm vi Int của database; kỳ dùng định dạng YYYY-MM.
const index = z.number({ invalid_type_error: 'Chỉ số phải là số nguyên', required_error: 'Bắt buộc nhập chỉ số' })
  .int('Chỉ số phải là số nguyên').min(0, 'Chỉ số không được âm')
  .max(2147483647, 'Chỉ số không được vượt quá 2147483647');
const period = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).refine((s) => !s.startsWith('0000'));
export const meterReadingsQuerySchema = z.object({ buildingId: httpIdSchema, period });
const reading = z.object({ roomId: databaseIdSchema, electricStart: index, electricEnd: index, waterStart: index, waterEnd: index });
/** Kiểm tra cả lô: không trùng phòng và chỉ số cuối không nhỏ hơn đầu cho từng loại công tơ. */
export const bulkMeterReadingsSchema = z.object({ buildingId: databaseIdSchema, period, readings: z.array(reading).min(1) }).superRefine((data, ctx) => {
  const seen = new Set<number>();
  data.readings.forEach((r, i) => {
    if (seen.has(r.roomId)) ctx.addIssue({ code: 'custom', path: ['readings', i, 'roomId'], message: 'Phòng bị trùng' });
    seen.add(r.roomId);
    // Dùng lại quy tắc tính tiêu thụ; path của lỗi xác định dòng và ô nhập tương ứng.
    for (const kind of ['electric', 'water'] as const) {
      try { calculateUsage(r[`${kind}Start`], r[`${kind}End`]); }
      catch { ctx.addIssue({ code: 'custom', path: ['readings', i, `${kind}End`], message: `Phòng ${r.roomId}: chỉ số mới nhỏ hơn chỉ số cũ` }); }
    }
  });
});
