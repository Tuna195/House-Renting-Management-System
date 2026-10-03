// Chạy test:  npm test        (hoặc npm run test:watch để tự chạy lại khi sửa code)
// Cách viết: TÍNH TAY kết quả đúng trước, rồi mới viết expect(...).toBe(kết quả đó).
import { describe, expect, it } from 'vitest';
import { calculateElectricityFlat, calculateUsage, sumItems } from './billing';

describe('calculateUsage', () => {
  it('trả về chỉ số mới trừ chỉ số cũ', () => {
    expect(calculateUsage(1250, 1380)).toBe(130);
  });

  it('cho phép tiêu thụ bằng 0 (phòng bỏ trống)', () => {
    expect(calculateUsage(500, 500)).toBe(0);
  });

  it('báo lỗi khi chỉ số mới nhỏ hơn chỉ số cũ', () => {
    expect(() => calculateUsage(1380, 1250)).toThrow();
  });
});

describe('calculateElectricityFlat', () => {
  it('nhân số kWh với đơn giá', () => {
    expect(calculateElectricityFlat(130, 3500)).toBe(455_000);
  });
});

describe('sumItems', () => {
  it('cộng các khoản, khoản giảm trừ là số âm', () => {
    expect(sumItems([{ amount: 3_000_000 }, { amount: 455_000 }, { amount: -100_000 }])).toBe(3_355_000);
  });
});

// TODO(TV3 — Tuần 3): bỏ ".todo" và viết nội dung khi làm từng hàm
describe('calculateElectricityTiered', () => {
  it.todo('130 kWh với 3 bậc [50:1984, 100:2050, ∞:2500] = 276.700đ');
  it.todo('số kWh nằm gọn trong bậc 1');
  it.todo('0 kWh = 0đ');
});

describe('calculateWater', () => {
  it.todo('PER_M3: 5 khối × 25.000 = 125.000đ');
  it.todo('PER_PERSON: 3 người × 100.000 = 300.000đ');
});

describe('prorateRent', () => {
  it.todo('vào ngày 16 tháng 10 (ở 16/31 ngày), giá 3.100.000 → 1.600.000đ');
  it.todo('ở đủ tháng → bằng đúng giá tháng');
});
