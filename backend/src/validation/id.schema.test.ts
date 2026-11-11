/** Regression biên ID: kiểu wire, cú pháp và phạm vi phải hợp lệ trước khi chuyển tới Prisma. */
import { describe, expect, it } from 'vitest';
import { databaseIdSchema, httpIdSchema, MAX_DATABASE_ID } from './id.schema';
import { parseId } from '../utils/app-error';
import { createRoomSchema, listRoomsQuerySchema } from '../modules/rooms/rooms.schema';
import { bulkMeterReadingsSchema, meterReadingsQuerySchema } from '../modules/meter-readings/meter-readings.schema';

const invalidTextIds: unknown[] = [
  undefined, null, '', ' ', ' 1', '1 ', '0', '-1', '+1', '01', '1.0', '1.5', '1e3', '0x10',
  'Infinity', 'NaN', '2147483648', '999999999999999999999999999999', '１２', '١', '1\n',
  ['1'], ['1', '2'], { id: '1' }, 1, true,
];
const invalidBodyIds: unknown[] = [undefined, null, '1', '1e3', '', true, [], {}, 0, -1, 1.1, NaN, Infinity, 2147483648, Number.MAX_SAFE_INTEGER + 1];

// Tách bảng test để phát hiện cả việc mở rộng coerce vô tình trong tương lai.
describe('ID query/path', () => {
  it.each(['1', '42', '2147483647'])('parse đúng ID %s', (value) => {
    expect(httpIdSchema.parse(value)).toBe(Number(value));
    expect(parseId(value)).toBe(Number(value));
  });
  it.each(invalidTextIds.map((value) => [value]))('từ chối dữ liệu URL %j', (value) => {
    expect(httpIdSchema.safeParse(value).success).toBe(false);
    expect(() => parseId(value)).toThrow(expect.objectContaining({ status: 400 }));
    expect(meterReadingsQuerySchema.safeParse({ buildingId: value, period: '2026-10' }).success).toBe(false);
  });
  it('rooms dùng cùng quy tắc, vẫn cho phép bỏ bộ lọc tùy chọn', () => {
    expect(listRoomsQuerySchema.parse({})).toEqual({});
    expect(listRoomsQuerySchema.parse({ buildingId: '2147483647' }).buildingId).toBe(MAX_DATABASE_ID);
    for (const buildingId of invalidTextIds.filter((value) => value !== undefined)) {
      expect(listRoomsQuerySchema.safeParse({ buildingId }).success).toBe(false);
    }
  });
});

describe('ID JSON body', () => {
  it.each([1, MAX_DATABASE_ID])('nhận ID number %i', (id) => expect(databaseIdSchema.parse(id)).toBe(id));
  it.each(invalidBodyIds.map((value) => [value]))('từ chối ID body %j', (id) => {
    expect(databaseIdSchema.safeParse(id).success).toBe(false);
    const result = bulkMeterReadingsSchema.safeParse({ buildingId: 1, period: '2026-10', readings: [
      { roomId: id, electricStart: 0, electricEnd: 1, waterStart: 0, waterEnd: 1 },
    ] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(['readings', 0, 'roomId']);
  });
  it('chặn ID sai trong body tạo phòng', () => {
    const room = { name: 'P1', baseRent: 1000, buildingId: 2147483648 };
    expect(createRoomSchema.safeParse(room).success).toBe(false);
    expect(createRoomSchema.safeParse({ ...room, buildingId: '1' }).success).toBe(false);
    expect(createRoomSchema.safeParse({ ...room, buildingId: MAX_DATABASE_ID }).success).toBe(true);
  });
});
