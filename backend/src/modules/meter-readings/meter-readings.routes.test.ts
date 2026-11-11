/** Kiểm tra HTTP thật với database giả: request ID sai phải trả 400 trước mọi truy vấn/transaction. */
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { validateBody } from '../../middlewares/validate';
import { AppError } from '../../utils/app-error';
import express, { type RequestHandler } from 'express';
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middlewares/error-handler';
import { parseId } from '../../utils/app-error';

const db = vi.hoisted(() => ({
  building: { findFirst: vi.fn() },
  room: { findMany: vi.fn(), findFirst: vi.fn() },
  invoice: { findFirst: vi.fn() },
  meterReading: { upsert: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('../../lib/prisma', () => ({ prisma: db }));
// Chỉ giả lập xác thực để cô lập validation; không cần credential hoặc database thật.
vi.mock('../../middlewares/auth', () => ({
  requireAuth: ((req, _res, next) => { req.user = { id: 1, role: 'LANDLORD' }; next(); }) satisfies RequestHandler,
  requireRole: () => ((_req, _res, next) => next()) satisfies RequestHandler,
  currentUser: () => ({ id: 1, role: 'LANDLORD' }),
}));
import meterRoutes from './meter-readings.routes';

let server: Server;
let baseUrl: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/meter-readings', meterRoutes);
  // Cùng helper parseId đang dùng ở buildings, rooms và tenants.
  app.get('/id/:id', (req, res) => res.json({ id: parseId(req.params.id) }));
  app.post('/body', validateBody(z.object({ value: z.number().int() })), (_req, res) => res.json({ ok: true }));
  app.get('/conflict', () => { throw new AppError(409, 'Xung đột'); });
  app.get('/write-conflict', () => { throw new Prisma.PrismaClientKnownRequestError('internal', {
    code: 'P2034', clientVersion: '6',
  }); });
  app.get('/db-error', () => { throw new Prisma.PrismaClientKnownRequestError('internal', {
    code: 'P2002', clientVersion: '6', meta: { internal: 'private metadata' },
  }); });
  app.use(errorHandler);
  server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Không lấy được cổng test');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  if (server?.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});
beforeEach(() => {
  vi.clearAllMocks();
  db.building.findFirst.mockResolvedValue(null);
  db.room.findMany.mockResolvedValue([]);
  db.room.findFirst.mockResolvedValue({ id: 1 });
  db.invoice.findFirst.mockResolvedValue(null);
  db.$transaction.mockImplementation(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db));
});

function expectNoDatabaseAccess() {
  expect(db.building.findFirst).not.toHaveBeenCalled();
  expect(db.room.findMany).not.toHaveBeenCalled();
  expect(db.$transaction).not.toHaveBeenCalled();
}

describe('ID validation tại biên HTTP', () => {
  it.each(['2147483648', '1e3', '0x10', '01', '%2B1', '%201', '1.5', '0', '-1', '99999999999999999999'])
    ('GET buildingId=%s trả 400 và không vào Prisma', async (id) => {
      const response = await fetch(`${baseUrl}/api/meter-readings?buildingId=${id}&period=2026-10`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ details: [expect.objectContaining({ path: ['buildingId'] })] });
      expectNoDatabaseAccess();
    });
  it.each(['', 'buildingId=1&buildingId=2', 'buildingId[id]=1', 'buildingId[]=1'])
    ('từ chối query thiếu/lặp/cấu trúc sai: %s', async (query) => {
      const response = await fetch(`${baseUrl}/api/meter-readings?${query}&period=2026-10`);
      expect(response.status).toBe(400);
      expectNoDatabaseAccess();
    });
  it('ID hợp lệ nhưng không tồn tại vẫn trả 404, không chuyển thành 400', async () => {
    const response = await fetch(`${baseUrl}/api/meter-readings?buildingId=2147483647&period=2026-10`);
    expect(response.status).toBe(404);
    expect(db.building.findFirst).toHaveBeenCalledWith({ where: { id: 2147483647, ownerId: 1 } });
  });
  it('query hợp lệ truyền ID kiểu number tới Prisma', async () => {
    db.building.findFirst.mockResolvedValue({ id: 1 });
    const response = await fetch(`${baseUrl}/api/meter-readings?buildingId=1&period=2026-10`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(db.building.findFirst).toHaveBeenCalledWith({ where: { id: 1, ownerId: 1 } });
  });
  it.each([
    { buildingId: 2147483648, roomId: 1 },
    { buildingId: '1', roomId: 1 },
    { buildingId: 1, roomId: 2147483648 },
    { buildingId: 1, roomId: '1' },
    { buildingId: 1, roomId: true },
    { buildingId: 1, roomId: [1] },
  ])('PUT body ID sai %j trả 400, không mở transaction', async ({ buildingId, roomId }) => {
    const response = await fetch(`${baseUrl}/api/meter-readings/bulk`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingId, period: '2026-10', readings: [
        { roomId, electricStart: 0, electricEnd: 1, waterStart: 0, waterEnd: 1 },
      ] }),
    });
    expect(response.status).toBe(400);
    expectNoDatabaseAccess();
  });
  it.each(['2147483648', '1e3', '0x10', '01', '1.5'])('ID path sai %s trả HTTP 400', async (id) => {
    const response = await fetch(`${baseUrl}/id/${id}`);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ details: [expect.objectContaining({ path: ['id'] })] });
    expectNoDatabaseAccess();
  });
});


describe('Hợp đồng lỗi API', () => {
  it('validation body và query cùng trả code/path/message, không lộ Zod metadata', async () => {
    const response = await fetch(`${baseUrl}/body`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'secret-input' }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details[0].path).toEqual(['value']);
    expect(Object.keys(body.details[0]).sort()).toEqual(['code', 'message', 'path']);
    expect(JSON.stringify(body)).not.toContain('secret-input');
  });
  it('JSON hỏng trả 400 với mã INVALID_JSON', async () => {
    const response = await fetch(`${baseUrl}/body`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'INVALID_JSON', details: [] });
  });
  it('xung đột nghiệp vụ giữ HTTP 409 và code ổn định', async () => {
    const response = await fetch(`${baseUrl}/conflict`);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'CONFLICT', message: 'Xung đột', details: [] });
  });
  it('không đưa metadata của Prisma vào response lỗi', async () => {
    const response = await fetch(`${baseUrl}/db-error`);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'DUPLICATE_RESOURCE', message: 'Dữ liệu bị trùng', details: [] });
  });
  it('lỗi chỉ số giảm xác định đúng ô, không mở transaction', async () => {
    const response = await fetch(`${baseUrl}/api/meter-readings/bulk`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingId: 1, period: '2026-10', readings: [
        { roomId: 1, electricStart: 10, electricEnd: 1, waterStart: 0, waterEnd: 1 },
      ] }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR', details: [
      expect.objectContaining({ path: ['readings', 0, 'electricEnd'], code: 'custom' }),
    ] });
    expectNoDatabaseAccess();
  });
  it('phòng đã phát hành hóa đơn có code và vị trí phòng, không ghi dữ liệu', async () => {
    db.building.findFirst.mockResolvedValue({ id: 1 });
    db.invoice.findFirst.mockResolvedValue({ id: 1 });
    const response = await fetch(`${baseUrl}/api/meter-readings/bulk`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingId: 1, period: '2026-10', readings: [
        { roomId: 1, electricStart: 0, electricEnd: 1, waterStart: 0, waterEnd: 1 },
      ] }),
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'PERIOD_LOCKED', details: [
      expect.objectContaining({ path: ['readings', 0], roomId: 1, code: 'PERIOD_LOCKED' }),
    ] });
    expect(db.meterReading.upsert).not.toHaveBeenCalled();
  });
});

it('xung đột transaction P2034 trả WRITE_CONFLICT, không báo thành công hoặc 500', async () => {
  const response = await fetch(`${baseUrl}/write-conflict`);
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: 'WRITE_CONFLICT', details: [] });
});
