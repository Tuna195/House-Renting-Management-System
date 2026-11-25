import type { MeterReading, WaterBillingType } from '@prisma/client';
import type { BuildInvoiceInput, PriceTier } from '../billing/billing';
import { calculateElectricityTiered } from '../billing/billing';

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function vietnamMidnight(year: number, monthIndex: number, day: number): Date {
  const utc = new Date(0);
  utc.setUTCFullYear(year, monthIndex, day);
  return new Date(utc.getTime() - VIETNAM_OFFSET_MS);
}

export function invoicePeriod(period: string) {
  const [year, month] = period.split('-').map(Number);
  const start = vietnamMidnight(year, month - 1, 1);
  const next = vietnamMidnight(year, month, 1);
  return { start, next, days: (next.getTime() - start.getTime()) / DAY_MS };
}

export function invoiceDueDate(period: string, dueDay: number): Date {
  const [year, month] = period.split('-').map(Number);
  return vietnamMidnight(year, month, dueDay);
}

export function coversEntireInvoicePeriod(
  contract: { startDate: Date; endDate: Date | null },
  period: ReturnType<typeof invoicePeriod>,
): boolean {
  // Ngày đầu và ngày cuối hợp đồng được tính theo lịch Việt Nam.
  return contract.startDate.getTime() < period.start.getTime() + DAY_MS
    && (contract.endDate === null || contract.endDate.getTime() >= period.next.getTime() - DAY_MS);
}

type InvoiceContract = {
  id: number;
  rentPrice: number;
  services: readonly { service: { name: string; price: number } }[];
};
type InvoiceBuilding = {
  electricityTiers: readonly PriceTier[];
  waterPrice: number;
  waterBillingType: WaterBillingType;
};
type InvoiceReading = Pick<MeterReading, 'period' | 'electricStart' | 'electricEnd' | 'waterStart' | 'waterEnd'>;

export function toInvoiceInput(
  contract: InvoiceContract,
  reading: InvoiceReading,
  building: InvoiceBuilding,
  period: string,
): BuildInvoiceInput {
  if (building.waterBillingType !== 'PER_M3') throw new Error('Chỉ hỗ trợ tính nước theo m³');
  return {
    contract: {
      id: contract.id,
      rentPrice: contract.rentPrice,
      // Hàm billing hiện tính phí dịch vụ cố định theo phòng.
      services: contract.services.map(({ service: { name, price } }) => ({ name, price })),
    },
    period,
    // Chỉ gọi cho hợp đồng đủ tháng. Gắn số ngày thuê đã xác nhận tại đây khi chốt quy tắc tháng lẻ.
    daysStayed: invoicePeriod(period).days,
    reading,
    electricityTiers: building.electricityTiers,
    waterPrice: building.waterPrice,
  };
}

export function hasValidElectricityTiers(tiers: readonly PriceTier[]): boolean {
  try {
    calculateElectricityTiered(0, tiers);
    return true;
  } catch {
    return false;
  }
}
