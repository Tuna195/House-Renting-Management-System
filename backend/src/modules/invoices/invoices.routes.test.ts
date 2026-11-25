import express from 'express';
import { beforeEach, expect, it, vi } from 'vitest';
import { signToken } from '../../middlewares/auth';
import { errorHandler } from '../../middlewares/error-handler';
import { createTestRequest } from '../../../test-utils/http-request';
import invoicesRoutes from './invoices.routes';

vi.mock('../../config/env', () => ({
  env: { JWT_SECRET: 'invoice-route-local-test-secret', JWT_EXPIRES_IN: '1h' },
}));

const db = vi.hoisted(() => ({
  building: { findFirst: vi.fn() },
  contract: { findMany: vi.fn() },
  meterReading: { findMany: vi.fn() },
  invoice: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('../../lib/prisma', () => ({ prisma: db }));

const app = express();
app.use(express.json());
app.use('/api/invoices', invoicesRoutes);
app.use(errorHandler);
const request = createTestRequest(app);

const landlord = { Authorization: `Bearer ${signToken({ id: 22, role: 'LANDLORD' })}` };
const tenant = { Authorization: `Bearer ${signToken({ id: 23, role: 'TENANT' })}` };
const input = { buildingId: 1, period: '2026-10' };
const root = '/api/invoices';

function generate(body: object) {
  return request(`${root}/generate`, {
    method: 'POST',
    headers: { ...landlord, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function expectNoPrismaCalls() {
  [
    db.building.findFirst, db.contract.findMany, db.meterReading.findMany,
    db.invoice.create, db.invoice.findFirst, db.invoice.findMany, db.$transaction,
  ].forEach((method) => expect(method).not.toHaveBeenCalled());
}

beforeEach(() => vi.resetAllMocks());

it.each([
  { headers: {}, status: 401, code: 'UNAUTHENTICATED' },
  { headers: tenant, status: 403, code: 'FORBIDDEN' },
])('chặn truy cập chưa đủ quyền với $status', async ({ headers, status, code }) => {
  const response = await request(root, { headers });
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({ code });
  expectNoPrismaCalls();
});

it.each([
  ['/01', 'id'],
  ['?buildingId=1e3', 'buildingId'],
  ['?status=UNKNOWN', 'status'],
])('GET %s trả 400 trước khi vào Prisma', async (suffix, field) => {
  const response = await request(root + suffix, { headers: landlord });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    code: 'VALIDATION_ERROR',
    details: [expect.objectContaining({ path: [field] })],
  });
  expectNoPrismaCalls();
});

it.each([
  { ...input, buildingId: '1' },
  { ...input, totalAmount: 1 },
])('POST từ chối JSON sai %j trước khi vào Prisma', async (body) => {
  const response = await generate(body);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  expectNoPrismaCalls();
});

it.each([
  { created: 1, status: 201 },
  { created: 0, status: 200 },
])('POST trả $status nếu tạo được $created hóa đơn', async ({ created, status }) => {
  db.building.findFirst.mockResolvedValue({
    name: 'Nhà trọ Bách Khoa', invoiceDueDay: 5, waterPrice: 25000, waterBillingType: 'PER_M3',
    electricityTiers: [{ upTo: null, price: 3000 }],
  });
  db.contract.findMany.mockResolvedValue(created ? [{
    id: 11, roomId: 4, room: { name: 'P101' }, rentPrice: 3000000, services: [], invoices: [],
    startDate: new Date('2026-10-01T00:00:00+07:00'), endDate: null,
  }] : []);
  db.meterReading.findMany.mockResolvedValue([
    { roomId: 4, period: input.period, electricStart: 0, electricEnd: 10, waterStart: 0, waterEnd: 1 },
  ]);
  db.invoice.create.mockResolvedValue({ id: 47 });
  db.$transaction.mockImplementation((transaction) => transaction(db));

  const response = await generate(input);
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ created, skipped: [], missingReadings: [] });
  expect(db.$transaction).toHaveBeenCalledTimes(created);
});

it('GET chi tiết trả 404 khi service không tìm thấy hóa đơn trong phạm vi chủ nhà', async () => {
  db.invoice.findFirst.mockResolvedValue(null);
  const response = await request(`${root}/11`, { headers: landlord });
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' });
  expect(db.invoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 11, contract: { room: { buildingId: undefined, building: { ownerId: 22 } } } },
  }));
});
