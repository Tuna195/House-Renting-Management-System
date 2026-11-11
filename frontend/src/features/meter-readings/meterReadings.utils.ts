/** Hàm thuần chuẩn bị dữ liệu bảng, kiểm tra chỉ số, tạo payload và tính cảnh báo tiêu thụ. */
import type { MeterRow, Reading } from '../../api/meter-readings';

// Chỉ số phải nằm trong giới hạn Int của database.
export const MAX_METER_INDEX = 2147483647;
// Thứ tự này cũng xác định vị trí cột nhập và điều hướng bằng bàn phím.
export const READING_FIELDS = [
  { field: 'electricStart', label: 'Điện cũ' },
  { field: 'electricEnd', label: 'Điện mới' },
  { field: 'waterStart', label: 'Nước cũ' },
  { field: 'waterEnd', label: 'Nước mới' },
] as const;

export type ReadingField = (typeof READING_FIELDS)[number]['field'];
export type MeterKind = 'electric' | 'water';
// Bản nháp có thể thiếu chỉ số; các bản nháp được lưu theo roomId.
export type ReadingValue = number | string;
export type ReadingDraft = Partial<Record<ReadingField, ReadingValue>>;
export type ReadingDrafts = Record<number, ReadingDraft>;
export interface EditableMeterRow extends MeterRow {
  values: ReadingDraft;
}

/** Ưu tiên bản nháp, rồi dữ liệu đã lưu; nếu chưa lưu thì gợi ý chỉ số đầu từ kỳ trước. */
export function prepareRows(rows: MeterRow[], drafts: ReadingDrafts): EditableMeterRow[] {
  return rows.map((row) => ({
    ...row,
    values: {
      ...(row.current ?? {
        electricStart: row.previous?.electricEnd,
        waterStart: row.previous?.waterEnd,
      }),
      ...drafts[row.room.id],
    },
  }));
}

/** Parse chỉ số giao diện, giữ nguyên chuỗi sai để hiển thị lỗi thay vì tự sửa giá trị. */
export function parseMeterIndex(value: unknown): number | undefined {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[0-9]+$/.test(value))) return undefined;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= MAX_METER_INDEX ? number : undefined;
}

/** Một nguồn kiểm tra dùng cho lỗi tại ô, nút lưu và tính tiêu thụ. */
export function getFieldError(values: ReadingDraft, field: ReadingField): string | undefined {
  const value = values[field];
  if (value === undefined || value === '') return 'Bắt buộc nhập chỉ số';
  if (typeof value === 'string' && !/^[0-9]+$/.test(value)) return 'Chỉ nhập chữ số từ 0 đến 9';
  const number = Number(value);
  if (!Number.isInteger(number)) return 'Chỉ số phải là số nguyên';
  if (number < 0) return 'Chỉ số không được âm';
  if (number > MAX_METER_INDEX) return `Chỉ số không được vượt quá ${MAX_METER_INDEX}`;
  if (field.endsWith('End')) {
    const start = parseMeterIndex(field === 'electricEnd' ? values.electricStart : values.waterStart);
    if (start !== undefined && number < start) return 'Chỉ số mới không được nhỏ hơn chỉ số cũ';
  }
  return undefined;
}

/** Kiểm tra đủ bốn chỉ số với cùng quy tắc dùng cho thông báo tại ô. */
export function isReadingValid({ values }: EditableMeterRow): boolean {
  return READING_FIELDS.every(({ field }) => getFieldError(values, field) === undefined);
}

/** Chuyển dòng đã qua isReadingValid thành dữ liệu gửi API; hàm này không tự validate. */
export function toReading({ room, values }: EditableMeterRow): Reading {
  return {
    roomId: room.id,
    electricStart: Number(values.electricStart),
    electricEnd: Number(values.electricEnd),
    waterStart: Number(values.waterStart),
    waterEnd: Number(values.waterEnd),
  };
}

/** Tính tiêu thụ và cảnh báo riêng cho điện/nước; trả null khi thiếu số hoặc chỉ số bị giảm. */
export function getConsumption(row: EditableMeterRow, kind: MeterKind) {
  const start = parseMeterIndex(row.values[`${kind}Start`]);
  const end = parseMeterIndex(row.values[`${kind}End`]);
  if (start === undefined || end === undefined || end < start) return null;

  const usage = end - start;
  // Chỉ so sánh gấp đôi nếu kỳ trước có tiêu thụ dương; cảnh báo không ngăn việc lưu.
  const previousUsage = row.previous ? row.previous[`${kind}End`] - row.previous[`${kind}Start`] : 0;
  let warning: string | undefined;
  if (usage === 0) warning = 'Không có tiêu thụ';
  else if (previousUsage > 0 && usage >= previousUsage * 2) warning = 'Tiêu thụ từ gấp đôi kỳ trước';
  return { usage, warning };
}
