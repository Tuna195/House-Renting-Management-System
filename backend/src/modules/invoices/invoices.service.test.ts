import { Prisma } from '@prisma/client';
import { beforeEach, expect, it, vi } from 'vitest';
import { generateInvoices } from './invoices.service';

const db = vi.hoisted(() => ({
  building: { findFirst: vi.fn() },
  contract: { findMany: vi.fn() },
  meterReading: { findMany: vi.fn() },
  invoice: { findFirst: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('../../lib/prisma', () => ({ prisma: db }));

const building = {
  name: 'Nhà A', invoiceDueDay: 5, waterPrice: 25000, waterBillingType: 'PER_M3',
  electricityTiers: [{ upTo: 50, price: 2000 }, { upTo: 100, price: 2500 }, { upTo: null, price: 3000 }],
};
const contract = {
  id: 1, roomId: 101, room: { name: 'P101' }, rentPrice: 3350000,
  startDate: new Date('2026-10-01T00:00:00+07:00'), endDate: new Date('2026-10-31T00:00:00+07:00'),
  services: [{ service: { name: 'Internet', price: 150000, buildingId: 10 } }], invoices: [],
};
const reading = { roomId: 101, period: '2026-10', electricStart: 100, electricEnd: 230, waterStart: 1, waterEnd: 6 };
const request = { buildingId: 10, period: '2026-10' };

beforeEach(() => {
  vi.resetAllMocks();
  db.building.findFirst.mockResolvedValue(building);
  db.contract.findMany.mockResolvedValue([contract]);
  db.meterReading.findMany.mockResolvedValue([reading]);
  db.$transaction.mockImplementation((execute) => execute(db));
});

it('lưu hóa đơn và bốn khoản, giữ nguyên phòng có hóa đơn và báo phòng thiếu chỉ số', async () => {
  db.contract.findMany.mockResolvedValue([
    contract,
    { ...contract, id: 2, roomId: 102, room: { name: 'P102' }, invoices: [{ id: 20 }] },
    { ...contract, id: 3, roomId: 103, room: { name: 'P103' } },
  ]);
  expect(await generateInvoices(1, request)).toEqual({
    created: 1,
    skipped: [{ roomId: 102, roomName: 'P102', contractId: 2, reason: 'ALREADY_EXISTS' }],
    missingReadings: [{ roomId: 103, roomName: 'P103', contractId: 3 }],
  });
  expect(db.$transaction).toHaveBeenCalledTimes(1);
  expect(db.invoice.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
    totalAmount: 3940000, status: 'DRAFT', paymentCode: 'HD1202610',
    contract: { connect: { id: 1, room: { buildingId: 10, building: { ownerId: 1 } } } },
    items: { create: [3350000, 315000, 125000, 150000].map((amount) => expect.objectContaining({ amount })) },
  }) }));
  expect(db.contract.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
    room: { buildingId: 10, building: { ownerId: 1 } },
    status: { in: ['ACTIVE', 'ENDED'] },
    startDate: { lt: new Date('2026-11-01T00:00:00+07:00') },
    OR: [{ endDate: null }, { endDate: { gte: new Date('2026-10-01T00:00:00+07:00') } }],
  } }));
});

it('xử lý P2002 ở request thua nếu xác nhận có cùng hóa đơn trong đúng phạm vi', async () => {
  const conflict = new Prisma.PrismaClientKnownRequestError('Trùng', { code: 'P2002', clientVersion: '6' });
  db.invoice.create.mockResolvedValueOnce({ id: 11 }).mockRejectedValueOnce(conflict);
  db.invoice.findFirst.mockResolvedValueOnce({ id: 11 });
  const results = await Promise.all([generateInvoices(1, request), generateInvoices(1, request)]);
  expect(results.map(({ created }) => created).sort()).toEqual([0, 1]);
  expect(results.flatMap(({ skipped }) => skipped)).toEqual([
    { roomId: 101, roomName: 'P101', contractId: 1, reason: 'ALREADY_EXISTS' },
  ]);
  db.invoice.create.mockRejectedValueOnce(conflict);
  db.invoice.findFirst.mockResolvedValueOnce(null);
  await expect(generateInvoices(1, request)).rejects.toBe(conflict);
});

it('bỏ qua chỉ số chung cho hai hợp đồng và ca tháng lẻ', async () => {
  db.contract.findMany.mockResolvedValue([
    contract, { ...contract, id: 2 },
    { ...contract, id: 3, roomId: 103, startDate: new Date('2026-10-02T00:00:00+07:00') },
  ]);
  db.meterReading.findMany.mockResolvedValue([reading, { ...reading, roomId: 103 }]);
  expect((await generateInvoices(1, request)).skipped.map(({ reason }) => reason))
    .toEqual(['MULTIPLE_CONTRACTS', 'MULTIPLE_CONTRACTS', 'PARTIAL_PERIOD']);
  expect(db.$transaction).not.toHaveBeenCalled();
});

it.each([{ electricityTiers: [] }, { waterBillingType: 'PER_PERSON' }])(
  'trả 400 có tên tòa nhà khi cấu hình sai %j', async (override) => {
    db.building.findFirst.mockResolvedValue({ ...building, ...override });
    await expect(generateInvoices(1, request)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('Nhà A') });
    expect(db.$transaction).not.toHaveBeenCalled();
  },
);

it('trả 404 trước khi đọc hợp đồng nếu không sở hữu tòa nhà', async () => {
  db.building.findFirst.mockResolvedValue(null);
  await expect(generateInvoices(1, request)).rejects.toMatchObject({ status: 404 });
  expect(db.contract.findMany).not.toHaveBeenCalled();
});

it('trả 400 kèm phòng, kỳ và nguyên nhân tính tiền', async () => {
  db.meterReading.findMany.mockResolvedValue([{ ...reading, electricEnd: 99 }]);
  await expect(generateInvoices(1, request)).rejects.toMatchObject({
    status: 400,
    message: 'Không tính được hóa đơn phòng “P101” kỳ 2026-10: Chỉ số mới nhỏ hơn chỉ số cũ',
  });
  expect(db.$transaction).not.toHaveBeenCalled();
});
