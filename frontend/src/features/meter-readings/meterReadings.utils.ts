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
export type ReadingDraft = Partial<Reading>;
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

/** Kiểm tra đủ bốn chỉ số nguyên trong giới hạn và không có chỉ số cuối nhỏ hơn đầu. */
export function isReadingValid({ values }: EditableMeterRow): boolean {
  return (
    READING_FIELDS.every(({ field }) => {
      const value = values[field];
      return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= MAX_METER_INDEX;
    }) &&
    Number(values.electricEnd) >= Number(values.electricStart) &&
    Number(values.waterEnd) >= Number(values.waterStart)
  );
}

/** Xác định ô thiếu dữ liệu hoặc chỉ số cuối nhỏ hơn đầu để hiển thị lỗi tại ô. */
export function isFieldInvalid(values: ReadingDraft, field: ReadingField): boolean {
  const isEnd = field.endsWith('End');
  const start = field === 'electricEnd' ? values.electricStart : values.waterStart;
  return values[field] == null || (isEnd && Number(values[field]) < Number(start));
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
  const start = row.values[`${kind}Start`];
  const end = row.values[`${kind}End`];
  if (start == null || end == null || end < start) return null;

  const usage = end - start;
  // Chỉ so sánh gấp đôi nếu kỳ trước có tiêu thụ dương; cảnh báo không ngăn việc lưu.
  const previousUsage = row.previous ? row.previous[`${kind}End`] - row.previous[`${kind}Start`] : 0;
  let warning: string | undefined;
  if (usage === 0) warning = 'Không có tiêu thụ';
  else if (previousUsage > 0 && usage >= previousUsage * 2) warning = 'Tiêu thụ từ gấp đôi kỳ trước';
  return { usage, warning };
}
