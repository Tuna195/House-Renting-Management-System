// =============================================================================
// CÁC HÀM TÍNH TIỀN — "trái tim" của hệ thống. Phụ trách: TV3.
//
// Nguyên tắc:
//  - Hàm THUẦN (pure function): chỉ nhận số, trả số. Không gọi DB, không đọc ngày giờ hệ thống.
//    Nhờ vậy test rất dễ (xem billing.test.ts) và giải thích được khi vấn đáp.
//  - Tiền là số nguyên VND. Làm tròn bằng Math.round ở bước cuối mỗi khoản.
//  - Quy tắc nghiệp vụ chi tiết: docs/03-cong-thuc-tinh-tien.md
// =============================================================================

/** Số tiêu thụ = chỉ số mới - chỉ số cũ. Chỉ số mới nhỏ hơn chỉ số cũ là lỗi nhập liệu. */
export function calculateUsage(start: number, end: number): number {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0) {
    throw new Error('Chỉ số phải là số nguyên không âm');
  }
  if (end < start) {
    throw new Error(`Chỉ số mới (${end}) nhỏ hơn chỉ số cũ (${start})`);
  }
  return end - start;
}

/** Tiền điện giá cố định: số kWh × đơn giá. */
export function calculateElectricityFlat(kwh: number, pricePerKwh: number): number {
  return Math.round(kwh * pricePerKwh);
}

export interface PriceTier {
  /** Giới hạn trên của bậc (kWh). null = không giới hạn (bậc cuối). */
  upTo: number | null;
  /** Đơn giá trong bậc (VND/kWh) */
  price: number;
}

/**
 * TODO(TV3 — Tuần 3): Tiền điện theo bậc thang.
 * Ví dụ bậc: [{upTo: 50, price: 1984}, {upTo: 100, price: 2050}, {upTo: null, price: 2500}]
 * 130 kWh = 50×1984 + 50×2050 + 30×2500
 * Gợi ý: duyệt từng bậc, lấy phần kWh rơi vào bậc đó = min(kwh, upTo) - mốc bậc trước.
 */
export function calculateElectricityTiered(_kwh: number, _tiers: PriceTier[]): number {
  throw new Error('Chưa làm — xem TODO ở trên');
}

/**
 * TODO(TV3 — Tuần 3): Tiền nước.
 *  - PER_M3:     số khối × đơn giá
 *  - PER_PERSON: số người × đơn giá (bỏ qua số khối)
 */
export function calculateWater(
  _type: 'PER_M3' | 'PER_PERSON',
  _params: { m3: number; occupants: number; price: number },
): number {
  throw new Error('Chưa làm — xem TODO ở trên');
}

/**
 * TODO(TV3 — Tuần 3): Tiền phòng tính theo ngày khi vào/ra giữa tháng.
 * Công thức nhóm đã chốt ở docs/03-cong-thuc-tinh-tien.md, ví dụ:
 *   tiền = giá tháng × số ngày ở / số ngày của tháng   (làm tròn đến 1.000đ)
 */
export function prorateRent(_monthlyRent: number, _daysStayed: number, _daysInMonth: number): number {
  throw new Error('Chưa làm — xem TODO ở trên');
}

/** Tổng tiền hóa đơn = tổng amount của các khoản (khoản giảm trừ có amount âm). */
export function sumItems(items: { amount: number }[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}
