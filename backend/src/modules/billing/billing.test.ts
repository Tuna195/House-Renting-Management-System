// Kết quả mong đợi được tính tay; biểu giá dưới đây chỉ là dữ liệu giả định.
import { describe, expect, it } from 'vitest';
import {
  buildInvoiceItems,
  calculateElectricityFlat,
  calculateElectricityTiered,
  calculateUsage,
  calculateWater,
  prorateRent,
  sumItems,
  type BuildInvoiceInput,
  type PriceTier,
} from './billing';

const MAX_DB_INT = 2_147_483_647;
const tiers: PriceTier[] = [
  { upTo: 50, price: 1_984 },
  { upTo: 100, price: 2_050 },
  { upTo: null, price: 2_500 },
];
const invalidNumbers = [-1, 0.5, NaN, Infinity, -Infinity, MAX_DB_INT + 1, Number.MAX_SAFE_INTEGER + 1];

function invoice(overrides: Partial<BuildInvoiceInput> = {}): BuildInvoiceInput {
  return {
    contract: {
      id: 1,
      rentPrice: 3_100_000,
      services: [{ name: 'Internet', price: 100_000 }, { name: 'Vệ sinh', price: 50_000 }],
    },
    period: '2026-10',
    daysStayed: 31,
    reading: { period: '2026-10', electricStart: 1_250, electricEnd: 1_380, waterStart: 210, waterEnd: 215 },
    electricityTiers: tiers,
    waterPrice: 25_000,
    ...overrides,
  };
}

describe('calculateUsage', () => {
  it.each([[1_250, 1_380, 130], [500, 500, 0], [0, 0, 0], [0, MAX_DB_INT, MAX_DB_INT]])(
    '%s → %s = %s', (start, end, expected) => {
      expect(calculateUsage(start, end)).toBe(expected);
    },
  );
  it('từ chối chỉ số lùi', () => expect(() => calculateUsage(1_380, 1_250)).toThrow('nhỏ hơn'));
  it.each(invalidNumbers)('từ chối chỉ số cũ không hợp lệ %s', value => {
    expect(() => calculateUsage(value, 100)).toThrow('Chỉ số cũ');
  });
  it.each(invalidNumbers)('từ chối chỉ số mới không hợp lệ %s', value => {
    expect(() => calculateUsage(0, value)).toThrow('Chỉ số mới');
  });
});

describe('calculateElectricityFlat', () => {
  it('nhân số kWh với đơn giá', () => expect(calculateElectricityFlat(130, 3_500)).toBe(455_000));
  it('cho phép giá bằng 0', () => expect(calculateElectricityFlat(10, 0)).toBe(0));
  it.each(invalidNumbers)('từ chối kWh %s', value => {
    expect(() => calculateElectricityFlat(value, 3_500)).toThrow();
  });
  it.each(invalidNumbers)('từ chối đơn giá %s', value => {
    expect(() => calculateElectricityFlat(0, value)).toThrow();
  });
  it('từ chối thành tiền vượt Int DB', () => {
    expect(() => calculateElectricityFlat(2, MAX_DB_INT)).toThrow('Số tiền');
  });
});

describe('calculateElectricityTiered', () => {
  it.each([
    [0, 0], [1, 1_984], [40, 79_360], [49, 97_216], [50, 99_200],
    [51, 101_250], [99, 199_650], [100, 201_700], [101, 204_200], [130, 276_700],
  ])('%s kWh = %s đồng, không tính toàn bộ theo bậc cao nhất', (kwh, expected) => {
    expect(calculateElectricityTiered(kwh, tiers)).toBe(expected);
  });
  it('cho phép một bậc duy nhất', () => {
    expect(calculateElectricityTiered(130, [{ upTo: null, price: 2_500 }])).toBe(325_000);
  });
  it('cho phép giá giảm giữa các bậc và giá bằng 0', () => {
    expect(calculateElectricityTiered(60, [{ upTo: 50, price: 2_000 }, { upTo: null, price: 0 }])).toBe(100_000);
  });
  const malformed: PriceTier[][] = [
    [], [{ upTo: 50, price: 1 }],
    [{ upTo: null, price: 1 }, { upTo: null, price: 2 }],
    [{ upTo: 50, price: 1 }, { upTo: 50, price: 2 }, { upTo: null, price: 3 }],
    [{ upTo: 100, price: 1 }, { upTo: 50, price: 2 }, { upTo: null, price: 3 }],
    ...[0, ...invalidNumbers].map(upTo => [{ upTo, price: 1 }, { upTo: null, price: 2 }]),
    ...invalidNumbers.map(price => [{ upTo: 50, price: 1 }, { upTo: null, price }]),
  ];
  it.each(malformed.map(table => [table]))('từ chối bảng giá sai kể cả khi không tiêu thụ: %j', table => {
    expect(() => calculateElectricityTiered(0, table)).toThrow();
  });
  it.each(invalidNumbers)('từ chối tiêu thụ %s', value => {
    expect(() => calculateElectricityTiered(value, tiers)).toThrow();
  });
  it('từ chối tổng nhiều bậc vượt Int DB', () => {
    expect(() => calculateElectricityTiered(2, [{ upTo: 1, price: MAX_DB_INT }, { upTo: null, price: 1 }]))
      .toThrow('Số tiền');
  });
});

describe('calculateWater', () => {
  it.each([[5, 25_000, 125_000], [0, 25_000, 0], [5, 0, 0]])('%s m³ × %s = %s', (m3, price, expected) => {
    expect(calculateWater('PER_M3', { m3, price, occupants: 10 })).toBe(expected);
  });
  it('số người không ảnh hưởng tiền nước', () => {
    expect(calculateWater('PER_M3', { m3: 5, price: 25_000, occupants: 0 })).toBe(125_000);
  });
  it('từ chối nước theo người còn tồn tại trong schema cũ', () => {
    expect(() => calculateWater('PER_PERSON', { m3: 5, price: 25_000, occupants: 3 })).toThrow('m³');
  });
  it.each(invalidNumbers)('từ chối số khối %s', value => {
    expect(() => calculateWater('PER_M3', { m3: value, price: 25_000, occupants: 0 })).toThrow();
  });
  it.each(invalidNumbers)('từ chối giá %s kể cả tiêu thụ bằng 0', value => {
    expect(() => calculateWater('PER_M3', { m3: 0, price: value, occupants: 0 })).toThrow();
  });
  it('từ chối thành tiền vượt Int DB', () => {
    expect(() => calculateWater('PER_M3', { m3: 2, price: MAX_DB_INT, occupants: 0 })).toThrow();
  });
});

describe('prorateRent', () => {
  it.each([
    [3_100_000, 16, 31, 1_600_000], [3_100_001, 31, 31, 3_100_001],
    [3_000_000, 0, 30, 0], [0, 15, 30, 0], [2_800_000, 1, 28, 100_000],
    [2_900_000, 15, 29, 1_500_000], [3_000_000, 1, 31, 97_000],
    [14_980, 1, 30, 0], [15_000, 1, 30, 1_000], [15_020, 1, 30, 1_000],
    [MAX_DB_INT, 31, 31, MAX_DB_INT],
  ])('giá %s, ở %s/%s ngày = %s', (rent, stayed, days, expected) => {
    expect(prorateRent(rent, stayed, days)).toBe(expected);
  });
  it.each(invalidNumbers)('từ chối giá thuê %s', value => {
    expect(() => prorateRent(value, 1, 31)).toThrow();
  });
  it.each([-1, 0.5, 32, NaN, Infinity])('từ chối số ngày ở %s', value => {
    expect(() => prorateRent(3_000_000, value, 31)).toThrow();
  });
  it.each([0, 27, 32, 30.5, NaN, Infinity])('từ chối số ngày trong tháng %s', value => {
    expect(() => prorateRent(3_000_000, 1, value)).toThrow();
  });
  it('từ chối ngày ở vượt số ngày tháng', () => expect(() => prorateRent(0, 30, 29)).toThrow());
});

describe('sumItems', () => {
  it('cộng khoản thu và giảm trừ', () => {
    expect(sumItems([{ amount: 3_000_000 }, { amount: 455_000 }, { amount: -100_000 }])).toBe(3_355_000);
  });
  it('mảng rỗng bằng 0', () => expect(sumItems([])).toBe(0));
  it('giảm vượt tổng được giới hạn 0', () => {
    expect(sumItems([{ amount: 500_000 }, { amount: -600_000 }])).toBe(0);
  });
  it('không giới hạn về 0 trước khi cộng đủ các dòng', () => {
    expect(sumItems([{ amount: -600_000 }, { amount: 500_000 }])).toBe(0);
  });
  it('tổng vượt Int DB bị từ chối', () => {
    expect(() => sumItems([{ amount: MAX_DB_INT }, { amount: 1 }])).toThrow();
  });
  it('cho phép giảm giá đưa tổng về trong giới hạn DB', () => {
    expect(sumItems([{ amount: MAX_DB_INT }, { amount: 1 }, { amount: -1 }])).toBe(MAX_DB_INT);
  });
  it.each([0.5, NaN, Infinity, -Infinity, MAX_DB_INT + 1, -MAX_DB_INT - 1])('từ chối amount %s', amount => {
    expect(() => sumItems([{ amount }])).toThrow();
  });
});

describe('buildInvoiceItems', () => {
  it('tạo đúng từng dòng cho hợp đồng một kỳ', () => {
    const items = buildInvoiceItems(invoice());
    expect(items).toEqual([
      {
        type: 'RENT', description: 'Tiền phòng 2026-10: 31/31 ngày',
        quantity: 1, unitPrice: 3_100_000, amount: 3_100_000,
      },
      {
        type: 'ELECTRICITY', description: 'Điện: 1250 → 1380 (130 kWh), bậc thang', quantity: 1,
        unitPrice: 276_700, amount: 276_700,
      },
      { type: 'WATER', description: 'Nước: 210 → 215 (5 m³)', quantity: 5, unitPrice: 25_000, amount: 125_000 },
      { type: 'SERVICE', description: 'Internet', quantity: 1, unitPrice: 100_000, amount: 100_000 },
      { type: 'SERVICE', description: 'Vệ sinh', quantity: 1, unitPrice: 50_000, amount: 50_000 },
    ]);
    expect(sumItems(items)).toBe(3_651_700);
  });
  it('giữa tháng chỉ chia tiền phòng, thu đủ từng dịch vụ', () => {
    const items = buildInvoiceItems(invoice({ daysStayed: 16 }));
    expect(items.map(item => item.amount)).toEqual([1_600_000, 276_700, 125_000, 100_000, 50_000]);
    expect(sumItems(items)).toBe(2_151_700);
  });
  it('sửa chữa và giảm giá thành dòng riêng; không tự thêm cọc hay phí phạt', () => {
    const items = buildInvoiceItems(invoice({
      repairs: [{ description: 'Sửa cửa', amount: 200_000 }],
      discount: 100_000,
    }));
    expect(items.slice(5)).toEqual([
      { type: 'OTHER', description: 'Sửa cửa', quantity: 1, unitPrice: 200_000, amount: 200_000 },
      { type: 'DISCOUNT', description: 'Giảm giá đã xác nhận', quantity: 1, unitPrice: -100_000, amount: -100_000 },
    ]);
    expect(sumItems(items)).toBe(3_751_700);
  });
  it('giảm vượt tổng vẫn giữ lịch sử dòng giảm và tổng bằng 0', () => {
    const items = buildInvoiceItems(invoice({ discount: 4_000_000 }));
    expect(items.at(-1)?.amount).toBe(-4_000_000);
    expect(sumItems(items)).toBe(0);
  });
  it('không thu dịch vụ ngoài hợp đồng, không thêm dòng giảm 0', () => {
    expect(buildInvoiceItems(invoice({ contract: { id: 1, rentPrice: 0, services: [] }, discount: 0 })))
      .toHaveLength(3);
  });
  it('không sửa đầu vào; các lần gọi tạo kết quả độc lập', () => {
    const input = invoice();
    const before = structuredClone(input);
    const first = buildInvoiceItems(input);
    first[0].amount = 0;
    expect(buildInvoiceItems(input)[0].amount).toBe(3_100_000);
    expect(input).toEqual(before);
  });
  it.each([
    ['2024-02', 29, 2_900_000], ['2026-02', 28, 2_800_000],
    ['2000-02', 29, 2_900_000], ['2100-02', 28, 2_800_000], ['2026-04', 30, 3_000_000],
  ])('số ngày thực tế của kỳ %s', (period, daysStayed, rentPrice) => {
    const input = invoice();
    const items = buildInvoiceItems({
      ...input, period, daysStayed,
      reading: { ...input.reading, period }, contract: { ...input.contract, rentPrice },
    });
    expect(items[0].amount).toBe(rentPrice);
    expect(items[0].quantity).toBe(1);
    expect(() => buildInvoiceItems({
      ...input, period, daysStayed: daysStayed + 1,
      reading: { ...input.reading, period },
    })).toThrow();
  });
  it.each(['2026-00', '2026-13', '2026-1', '26-01', '0000-01', '2026-10\n', ' 2026-10', '2026-10-01'])
    ('từ chối kỳ %j', period => expect(() => buildInvoiceItems(invoice({ period }))).toThrow('Kỳ'));
  it('từ chối chỉ số sai kỳ', () => {
    const input = invoice();
    expect(() => buildInvoiceItems({ ...input, reading: { ...input.reading, period: '2026-09' } })).toThrow('kỳ');
  });
  it.each(['electricEnd', 'waterEnd'] as const)('từ chối chỉ số lùi ở %s', field => {
    const input = invoice();
    expect(() => buildInvoiceItems({ ...input, reading: { ...input.reading, [field]: 0 } })).toThrow('nhỏ hơn');
  });
  it.each([0, ...invalidNumbers])('từ chối mã hợp đồng %s', id => {
    expect(() => buildInvoiceItems(invoice({ contract: { id, rentPrice: 0, services: [] } }))).toThrow();
  });
  it('từ chối dịch vụ không tên', () => {
    expect(() => buildInvoiceItems(invoice({
      contract: {
        id: 1, rentPrice: 0,
        services: [{ name: '  ', price: 1 }],
      },
    }))).toThrow('Tên dịch vụ');
  });
  it('từ chối sửa chữa không mô tả', () => {
    expect(() => buildInvoiceItems(invoice({ repairs: [{ description: ' ', amount: 1 }] }))).toThrow('Mô tả');
  });
  it.each(invalidNumbers)('từ chối giá dịch vụ %s', price => {
    expect(() => buildInvoiceItems(invoice({
      contract: {
        id: 1, rentPrice: 0,
        services: [{ name: 'Internet', price }],
      },
    }))).toThrow();
  });
  it.each(invalidNumbers)('từ chối phí sửa chữa %s', amount => {
    expect(() => buildInvoiceItems(invoice({ repairs: [{ description: 'Sửa cửa', amount }] }))).toThrow();
  });
  it.each(invalidNumbers)('từ chối giảm giá %s', discount => {
    expect(() => buildInvoiceItems(invoice({ discount }))).toThrow();
  });
  it('từ chối tổng hóa đơn vượt Int DB dù từng dòng hợp lệ', () => {
    expect(() => buildInvoiceItems(invoice({ contract: { id: 1, rentPrice: MAX_DB_INT, services: [] } }))).toThrow();
  });
});

describe('buildInvoiceItems — thay công tơ điện', () => {
  function replacedInvoice(): BuildInvoiceInput {
    const input = invoice();
    return {
      ...input,
      reading: { ...input.reading, electricStart: 1_250, electricEnd: 80 },
      electricReplacement: { date: '2026-10-15', oldEnd: 1_300, newStart: 0 },
    };
  }

  it('cộng 50 kWh công tơ cũ và 80 kWh công tơ mới rồi áp bậc thang một lần', () => {
    const input = replacedInvoice();
    const before = structuredClone(input);
    const items = buildInvoiceItems(input);
    expect(items[1]).toEqual({
      type: 'ELECTRICITY',
      description: 'Điện: thay công tơ 2026-10-15, cũ 1250 → 1300, mới 0 → 80 (130 kWh), bậc thang',
      quantity: 1,
      unitPrice: 276_700,
      amount: 276_700,
    });
    expect(sumItems(items)).toBe(3_651_700);
    expect(input).toEqual(before);
  });

  it('chỉ số ban đầu công tơ mới có thể khác 0', () => {
    const input = replacedInvoice();
    input.electricReplacement = { date: '2026-10-15', oldEnd: 1_300, newStart: 10 };
    // 50 + (80 - 10) = 120 kWh: 99.200 + 102.500 + 50.000.
    expect(buildInvoiceItems(input)[1].amount).toBe(251_700);
  });

  it('cho phép cả hai lượt đo bằng 0', () => {
    const input = replacedInvoice();
    input.reading.electricEnd = 10;
    input.electricReplacement = { date: '2026-10-15', oldEnd: 1_250, newStart: 10 };
    expect(buildInvoiceItems(input)[1].amount).toBe(0);
  });

  it.each(['2026-10-01', '2026-10-31'])('cho phép thay vào ngày biên %s', date => {
    const input = replacedInvoice();
    input.electricReplacement = { date, oldEnd: 1_300, newStart: 0 };
    expect(buildInvoiceItems(input)[1].amount).toBe(276_700);
  });

  it.each([
    '', '2026-09-15', '2026-11-01', '2026-10-00', '2026-10-32',
    '2026-10-1', '2026-10-15T00:00:00Z', '2026-10-15\n', '2026-10-xx',
  ])('từ chối ngày thay sai %j', date => {
    const input = replacedInvoice();
    input.electricReplacement = { date, oldEnd: 1_300, newStart: 0 };
    expect(() => buildInvoiceItems(input)).toThrow('Ngày thay công tơ');
  });

  it.each([
    ['2024-02', '2024-02-29', true],
    ['2026-02', '2026-02-29', false],
    ['2000-02', '2000-02-29', true],
    ['2100-02', '2100-02-29', false],
    ['2026-04', '2026-04-31', false],
  ])('kiểm tra ngày thực tế %s, %s', (period, date, valid) => {
    const input = replacedInvoice();
    input.period = period;
    input.daysStayed = 1;
    input.reading.period = period;
    input.electricReplacement = { date, oldEnd: 1_300, newStart: 0 };
    if (valid) {
      expect(buildInvoiceItems(input)[1].amount).toBe(276_700);
    } else {
      expect(() => buildInvoiceItems(input)).toThrow('Ngày thay công tơ');
    }
  });

  it.each([
    { date: '2026-10-15', oldEnd: 1_249, newStart: 0 },
    { date: '2026-10-15', oldEnd: 1_300, newStart: 81 },
  ])('từ chối chỉ số lùi ở từng lượt đo: %j', replacement => {
    expect(() => buildInvoiceItems({ ...replacedInvoice(), electricReplacement: replacement })).toThrow('nhỏ hơn');
  });

  it.each(invalidNumbers)('từ chối chỉ số cuối công tơ cũ %s', oldEnd => {
    expect(() => buildInvoiceItems({
      ...replacedInvoice(),
      electricReplacement: { date: '2026-10-15', oldEnd, newStart: 0 },
    })).toThrow('Chỉ số');
  });

  it.each(invalidNumbers)('từ chối chỉ số ban đầu công tơ mới %s', newStart => {
    expect(() => buildInvoiceItems({
      ...replacedInvoice(),
      electricReplacement: { date: '2026-10-15', oldEnd: 1_300, newStart },
    })).toThrow('Chỉ số');
  });

  it('từ chối tổng tiêu thụ vượt Int DB dù từng lượt đo hợp lệ', () => {
    const input = replacedInvoice();
    input.reading.electricStart = 0;
    input.reading.electricEnd = 1;
    input.electricityTiers = [{ upTo: null, price: 0 }];
    input.electricReplacement = { date: '2026-10-15', oldEnd: MAX_DB_INT, newStart: 0 };
    expect(() => buildInvoiceItems(input)).toThrow('Số kWh');
  });
});
