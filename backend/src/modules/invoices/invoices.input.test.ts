import { describe, expect, it } from 'vitest';
import { buildInvoiceItems, sumItems } from '../billing/billing';
import { coversEntireInvoicePeriod, hasValidElectricityTiers, invoiceDueDate, invoicePeriod, toInvoiceInput } from './invoices.input';

const tiers = [{ upTo: 50, price: 2000 }, { upTo: 100, price: 2500 }, { upTo: null, price: 3000 }];

describe('Đầu vào tính tiền hóa đơn', () => {
  it('đổi dữ liệu P101 thành bốn khoản VND và tổng 3.940.000', () => {
    const input = toInvoiceInput(
      { id: 1, rentPrice: 3350000, services: [{ service: { name: 'Internet', price: 150000 } }] },
      { period: '2026-10', electricStart: 120, electricEnd: 250, waterStart: 20, waterEnd: 25 },
      { electricityTiers: tiers, waterPrice: 25000, waterBillingType: 'PER_M3' },
      '2026-10',
    );
    const items = buildInvoiceItems(input);
    expect(items.map(({ amount }) => amount)).toEqual([3350000, 315000, 125000, 150000]);
    expect(sumItems(items)).toBe(3940000);
  });

  it('tính đầu, cuối kỳ và hạn đóng theo giờ Việt Nam, kể cả qua năm', () => {
    const { start, next, days } = invoicePeriod('2026-12');
    expect(start.toISOString()).toBe('2026-11-30T17:00:00.000Z');
    expect(next.toISOString()).toBe('2026-12-31T17:00:00.000Z');
    expect(days).toBe(31);
    expect(invoicePeriod('2028-02').days).toBe(29);
    expect(invoicePeriod('0099-12').next.toISOString()).toBe('0099-12-31T17:00:00.000Z');
    expect(invoiceDueDate('2026-12', 5).toISOString()).toBe('2027-01-04T17:00:00.000Z');
  });

  it('xét ngày cuối là ngày thuê và nhận diện hợp đồng tháng lẻ', () => {
    const period = invoicePeriod('2026-10');
    const startDate = new Date('2026-10-01T00:00:00+07:00');
    expect(coversEntireInvoicePeriod({ startDate, endDate: new Date('2026-10-31T00:00:00+07:00') }, period)).toBe(true);
    expect(coversEntireInvoicePeriod({ startDate, endDate: new Date('2026-10-30T23:59:59+07:00') }, period)).toBe(false);
    expect(coversEntireInvoicePeriod({ startDate: new Date('2026-10-02T00:00:00+07:00'), endDate: null }, period)).toBe(false);
  });

  it('kiểm tra cả cấu trúc lẫn đơn giá của biểu giá', () => {
    expect(hasValidElectricityTiers(tiers)).toBe(true);
    expect(hasValidElectricityTiers([])).toBe(false);
    expect(hasValidElectricityTiers(tiers.slice(0, 2))).toBe(false);
    expect(hasValidElectricityTiers([{ upTo: null, price: -1 }])).toBe(false);
    expect(hasValidElectricityTiers([tiers[1], tiers[0], tiers[2]])).toBe(false);
  });
});
