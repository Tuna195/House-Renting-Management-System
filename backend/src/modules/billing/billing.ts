// Các hàm thuần: không truy cập DB hoặc đọc thời gian hệ thống.
// Quy tắc nghiệp vụ: docs/03-cong-thuc-tinh-tien.md.
const MAX_DB_INT = 2_147_483_647;

function requireInteger(value: number, label: string, max = MAX_DB_INT): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new Error(`${label} phải là số nguyên không âm, không vượt ${max}`);
  }
}

function requireMoney(value: number): number {
  requireInteger(value, 'Số tiền');
  return value;
}

/** Chỉ số mới nhỏ hơn chỉ số cũ phải được xử lý trước khi lập hóa đơn. */
export function calculateUsage(start: number, end: number): number {
  requireInteger(start, 'Chỉ số cũ');
  requireInteger(end, 'Chỉ số mới');
  if (end < start) {
    throw new Error('Chỉ số mới nhỏ hơn chỉ số cũ');
  }
  return end - start;
}

/** Tiện ích tương thích; hóa đơn mới dùng điện bậc thang. */
export function calculateElectricityFlat(kwh: number, pricePerKwh: number): number {
  requireInteger(kwh, 'Số kWh');
  requireMoney(pricePerKwh);
  return requireMoney(kwh * pricePerKwh);
}

export interface PriceTier {
  /** Mốc lũy kế; bậc cuối bắt buộc null (không giới hạn). */
  upTo: number | null;
  price: number;
}

export function calculateElectricityTiered(kwh: number, tiers: readonly PriceTier[]): number {
  requireInteger(kwh, 'Số kWh');
  if (tiers.length === 0 || tiers[tiers.length - 1].upTo !== null) {
    throw new Error('Bảng giá phải có bậc cuối không giới hạn');
  }
  let previous = 0;
  let total = 0;
  for (const [index, tier] of tiers.entries()) {
    requireMoney(tier.price);
    if (tier.upTo === null) {
      if (index !== tiers.length - 1) throw new Error('Bậc không giới hạn phải nằm cuối');
    } else {
      requireInteger(tier.upTo, 'Mốc bậc');
      if (tier.upTo <= previous) throw new Error('Mốc bậc phải tăng nghiêm ngặt');
    }
    const upper = tier.upTo ?? kwh;
    const usage = Math.max(0, Math.min(kwh, upper) - previous);
    total = requireMoney(total + usage * tier.price);
    previous = upper;
  }
  return total;
}

/** Giữ tham số occupants để tương thích chữ ký cũ; không dùng để thu tiền. */
export function calculateWater(
  type: 'PER_M3' | 'PER_PERSON',
  params: { m3: number; occupants: number; price: number },
): number {
  if (type !== 'PER_M3') throw new Error('Chỉ hỗ trợ tính nước theo m³');
  requireInteger(params.m3, 'Số m³');
  requireMoney(params.price);
  return requireMoney(params.m3 * params.price);
}

export function prorateRent(monthlyRent: number, daysStayed: number, daysInMonth: number): number {
  requireMoney(monthlyRent);
  requireInteger(daysStayed, 'Số ngày ở', 31);
  requireInteger(daysInMonth, 'Số ngày trong tháng', 31);
  if (daysInMonth < 28 || daysStayed > daysInMonth) throw new Error('Số ngày thuê không hợp lệ');
  if (daysStayed === daysInMonth) return monthlyRent;
  return requireMoney(Math.round((monthlyRent * daysStayed) / daysInMonth / 1_000) * 1_000);
}

/** Giảm giá vượt tổng không tạo số tiền âm hoặc tín dụng cho kỳ sau. */
export function sumItems(items: readonly { amount: number }[]): number {
  let total = 0;
  for (const item of items) {
    requireMoney(Math.abs(item.amount));
    total += item.amount;
    if (!Number.isSafeInteger(total)) throw new Error('Tổng tiền vượt giới hạn tính toán an toàn');
  }
  return requireMoney(Math.max(0, total));
}

export interface InvoiceItemInput {
  type: 'RENT' | 'ELECTRICITY' | 'WATER' | 'SERVICE' | 'OTHER' | 'DISCOUNT';
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface BuildInvoiceInput {
  contract: {
    id: number;
    rentPrice: number;
    services: readonly { name: string; price: number }[];
  };
  period: string;
  /** Số ngày đã được xác nhận; không suy ra quy tắc tính ngày vào/ra. */
  daysStayed: number;
  reading: { period: string; electricStart: number; electricEnd: number; waterStart: number; waterEnd: number };
  /** Một lần thay công tơ điện trong kỳ; ngày địa phương YYYY-MM-DD. */
  electricReplacement?: { date: string; oldEnd: number; newStart: number };
  electricityTiers: readonly PriceTier[];
  waterPrice: number;
  /** Chỉ nhận số tiền sửa chữa và giảm giá đã được xác nhận. */
  repairs?: readonly { description: string; amount: number }[];
  discount?: number;
}

/** Lập các dòng cho một hợp đồng/kỳ; caller kiểm tra quyền và lưu trong transaction. */
export function buildInvoiceItems(input: BuildInvoiceInput): InvoiceItemInput[] {
  const { contract, period, reading } = input;
  requireInteger(contract.id, 'Mã hợp đồng');
  if (contract.id === 0) throw new Error('Mã hợp đồng phải lớn hơn 0');
  if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(period) || period.startsWith('0000')) {
    throw new Error('Kỳ phải có định dạng YYYY-MM và năm lớn hơn 0');
  }
  if (reading.period !== period) throw new Error('Chỉ số không thuộc kỳ hóa đơn');
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  const replacement = input.electricReplacement;
  let electricity: number;
  let electricDescription: string;
  if (replacement) {
    if (
      replacement.date.length !== 10 ||
      !replacement.date.startsWith(`${period}-`) ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(replacement.date) ||
      Number(replacement.date.slice(8)) < 1 ||
      Number(replacement.date.slice(8)) > daysInMonth
    ) {
      throw new Error('Ngày thay công tơ phải là ngày hợp lệ trong kỳ hóa đơn');
    }
    const oldUsage = calculateUsage(reading.electricStart, replacement.oldEnd);
    const newUsage = calculateUsage(replacement.newStart, reading.electricEnd);
    electricity = oldUsage + newUsage;
    requireInteger(electricity, 'Số kWh');
    electricDescription = `Điện: thay công tơ ${replacement.date}, ` +
      `cũ ${reading.electricStart} → ${replacement.oldEnd}, ` +
      `mới ${replacement.newStart} → ${reading.electricEnd} (${electricity} kWh), bậc thang`;
  } else {
    electricity = calculateUsage(reading.electricStart, reading.electricEnd);
    electricDescription = `Điện: ${reading.electricStart} → ${reading.electricEnd} (${electricity} kWh), bậc thang`;
  }
  const water = calculateUsage(reading.waterStart, reading.waterEnd);
  const rent = prorateRent(contract.rentPrice, input.daysStayed, daysInMonth);
  const electricAmount = calculateElectricityTiered(electricity, input.electricityTiers);
  const waterAmount = calculateWater('PER_M3', { m3: water, occupants: 0, price: input.waterPrice });
  const items: InvoiceItemInput[] = [
    {
      type: 'RENT', description: `Tiền phòng ${period}: ${input.daysStayed}/${daysInMonth} ngày`,
      quantity: input.daysStayed / daysInMonth, unitPrice: contract.rentPrice, amount: rent,
    },
    // Điện lũy tiến là một gói tính theo bảng bậc; không tạo đơn giá bình quân bị làm tròn.
    {
      type: 'ELECTRICITY',
      description: electricDescription,
      quantity: 1, unitPrice: electricAmount, amount: electricAmount,
    },
    {
      type: 'WATER', description: `Nước: ${reading.waterStart} → ${reading.waterEnd} (${water} m³)`,
      quantity: water, unitPrice: input.waterPrice, amount: waterAmount,
    },
  ];
  for (const service of contract.services) {
    if (!service.name.trim()) throw new Error('Tên dịch vụ không được trống');
    items.push({
      type: 'SERVICE', description: service.name, quantity: 1,
      unitPrice: requireMoney(service.price), amount: service.price,
    });
  }
  for (const repair of input.repairs ?? []) {
    if (!repair.description.trim()) throw new Error('Mô tả sửa chữa không được trống');
    items.push({
      type: 'OTHER', description: repair.description, quantity: 1,
      unitPrice: requireMoney(repair.amount), amount: repair.amount,
    });
  }
  const discount = requireMoney(input.discount ?? 0);
  if (discount > 0) {
    items.push({
      type: 'DISCOUNT', description: 'Giảm giá đã xác nhận', quantity: 1,
      unitPrice: -discount, amount: -discount,
    });
  }
  sumItems(items);
  return items;
}
