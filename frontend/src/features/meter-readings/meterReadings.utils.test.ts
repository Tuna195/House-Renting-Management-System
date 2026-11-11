/** Đối chiếu validation UI/API trên cùng bộ dữ liệu để ngăn hai tầng chấp nhận khác nhau. */
import { describe, expect, it } from 'vitest';
import { bulkMeterReadingsSchema } from '../../../../backend/src/modules/meter-readings/meter-readings.schema';
import { getConsumption, getFieldError, isReadingValid, prepareRows, toReading,
  type EditableMeterRow, type ReadingValue } from './meterReadings.utils';

function row(value: ReadingValue | undefined): EditableMeterRow {
  return { room: { id: 1, name: 'P1' }, current: null, previous: null, locked: false,
    values: { electricStart: 0, electricEnd: value, waterStart: 0, waterEnd: 1 } };
}

describe('Validation chỉ số thống nhất', () => {
  it.each([undefined, '', ' ', 'abc', '-1', '1.5', '1e3', '0x10', '2147483648', NaN, Infinity, -1, 1.5, 2147483648])
    ('báo lỗi tại ô và chặn lưu với %s', (value) => {
      const input = row(value);
      expect(getFieldError(input.values, 'electricEnd')).toBeTruthy();
      expect(isReadingValid(input)).toBe(false);
      expect(getConsumption(input, 'electric')).toBeNull();
    });
  it.each([0, 1, 2147483647, '0', '01', '2147483647'])('UI chấp nhận %s và payload được backend chấp nhận', (value) => {
    const input = row(value);
    expect(getFieldError(input.values, 'electricEnd')).toBeUndefined();
    expect(isReadingValid(input)).toBe(true);
    expect(bulkMeterReadingsSchema.safeParse({ buildingId: 1, period: '2026-10', readings: [toReading(input)] }).success).toBe(true);
  });
  it.each([-1, 1.5, 2147483648, 0, 2147483647])('hai tầng có cùng kết quả với số %s', (value) => {
    const input = row(value);
    const body = { buildingId: 1, period: '2026-10', readings: [{ roomId: 1, ...input.values }] };
    expect(bulkMeterReadingsSchema.safeParse(body).success).toBe(isReadingValid(input));
  });
  it('chỉ số mới nhỏ hơn cũ có lỗi cụ thể và không tạo tiêu thụ', () => {
    const input = row(5); input.values.electricStart = 10;
    expect(getFieldError(input.values, 'electricEnd')).toContain('nhỏ hơn');
    expect(isReadingValid(input)).toBe(false);
    expect(getConsumption(input, 'electric')).toBeNull();
  });
  it.each([['electric', 0, true], ['electric', 19, false], ['electric', 20, true],
    ['water', 0, true], ['water', 19, false], ['water', 20, true]] as const)
    ('cảnh báo %s ở ngưỡng %i: %s', (kind, usage, warning) => {
      const input = row(usage); input.values.waterEnd = usage;
      input.previous = { roomId: 1, electricStart: 0, electricEnd: 10, waterStart: 0, waterEnd: 10 };
      expect(Boolean(getConsumption(input, kind)?.warning)).toBe(warning);
      expect(isReadingValid(input)).toBe(true);
    });
  it('không cảnh báo gấp đôi khi kỳ trước bằng 0; cảnh báo điện không ảnh hưởng nước', () => {
    const input = row(100);
    input.previous = { roomId: 1, electricStart: 0, electricEnd: 0, waterStart: 0, waterEnd: 0 };
    expect(getConsumption(input, 'electric')?.warning).toBeUndefined();
    expect(getConsumption(input, 'water')?.warning).toBeUndefined();
  });
  it('ưu tiên bản nháp, rồi bản ghi hiện tại, rồi gợi ý kỳ lịch sử gần nhất', () => {
    const source = { ...row(20), previous: { roomId: 1, electricStart: 1, electricEnd: 10, waterStart: 1, waterEnd: 5 } };
    expect(prepareRows([source], {})[0].values.electricStart).toBe(10);
    source.current = null;
    expect(prepareRows([source], { 1: { electricStart: 12 } })[0].values.electricStart).toBe(12);
    expect(prepareRows([{ ...source, current: { ...source.previous, electricStart: 99 } }], {})[0].values.electricStart).toBe(99);
  });
});
