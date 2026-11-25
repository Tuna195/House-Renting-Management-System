import type { PrismaClient } from '@prisma/client';
import { createServer, type Server } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInvoiceDemo, deleteInvoiceDemo, DEMO_PERIOD, DEMO_TOTAL, type InvoiceDemo } from '../../../prisma/invoice-demo-fixture';

const testUrl = process.env.INVOICE_TEST_DATABASE_URL;

describe.skipIf(!testUrl)('API hóa đơn với PostgreSQL thật', () => {
  let db: PrismaClient;
  let demo: InvoiceDemo | undefined;
  let server: Server;
  let baseUrl: string;
  let signToken: typeof import('../../middlewares/auth').signToken;

  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL', testUrl);
    vi.stubEnv('JWT_SECRET', 'invoice-integration-test-secret');
    const { app } = await import('../../app.js');
    ({ prisma: db } = await import('../../lib/prisma.js'));
    ({ signToken } = await import('../../middlewares/auth.js'));
    server = createServer(app);
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Không lấy được cổng test');
    baseUrl = `http://127.0.0.1:${address.port}/api/invoices`;
  });

  beforeEach(async () => { demo = await createInvoiceDemo(db); });
  afterEach(async () => {
    if (demo) await deleteInvoiceDemo(db, demo);
    demo = undefined;
  });
  afterAll(async () => {
    if (server?.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await db?.$disconnect();
    vi.unstubAllEnvs();
  });

  function get(path: string, user = demo!.owner) {
    return fetch(baseUrl + path, { headers: { Authorization: `Bearer ${signToken(user)}` } });
  }

  function generate(buildingId = demo!.building.id, user = demo!.owner, body?: object) {
    return fetch(baseUrl + '/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${signToken(user)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? { buildingId, period: DEMO_PERIOD }),
    });
  }

  it('tạo đúng 3.940.000 đ từ ENDED đủ tháng, loại CANCELLED và giữ nguyên hóa đơn cũ', async () => {
    const { building, p101, p102, p103, existing, tenant } = demo!;
    const cancelledRoom = await db.room.create({ data: { buildingId: building.id, name: 'P104', baseRent: 3350000 } });
    const cancelled = await db.contract.create({
      data: { roomId: cancelledRoom.id, status: 'CANCELLED', rentPrice: 3350000, startDate: new Date('2026-09-01') },
    });
    await db.meterReading.create({
      data: {
        roomId: cancelledRoom.id, period: DEMO_PERIOD, recordedById: demo!.owner.id,
        electricStart: 100, electricEnd: 230, waterStart: 0, waterEnd: 5,
      },
    });
    const response = await generate();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      created: 1,
      skipped: [{ contractId: p102.id, roomId: p102.roomId, roomName: 'P102', reason: 'ALREADY_EXISTS' }],
      missingReadings: [{ contractId: p103.id, roomId: p103.roomId, roomName: 'P103' }],
    });
    const draft = await db.invoice.findUniqueOrThrow({
      where: { contractId_period: { contractId: p101.id, period: DEMO_PERIOD } },
      include: { items: { orderBy: { id: 'asc' } } },
    });
    expect(draft).toMatchObject({ totalAmount: DEMO_TOTAL, status: 'DRAFT', paidAmount: 0, issuedAt: null });
    expect(draft.items.map(({ amount }) => amount)).toEqual([3350000, 315000, 125000, 150000]);
    expect(await db.invoice.count({ where: { contractId: cancelled.id } })).toBe(0);

    const list = await get(`?buildingId=${building.id}&period=${DEMO_PERIOD}&status=DRAFT`);
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual(expect.arrayContaining([expect.objectContaining({
      id: draft.id, totalAmount: DEMO_TOTAL, room: { id: p101.roomId, name: 'P101' },
      building: { id: building.id, name: building.name }, primaryTenant: { id: tenant.id, fullName: tenant.fullName },
      dueDate: '2026-11-04T17:00:00.000Z',
    })]));
    const detail = await get(`/${draft.id}`);
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({ totalAmount: DEMO_TOTAL, payments: [], items: draft.items.map(({ amount }) => ({ amount })) });

    for (const repeat of [await generate(), ...await Promise.all([generate(), generate()])]) {
      expect(repeat.status).toBe(200);
      expect(await repeat.json()).toMatchObject({ created: 0 });
    }
    expect(await db.invoice.findUniqueOrThrow({ where: { id: draft.id }, include: { items: { orderBy: { id: 'asc' } } } })).toEqual(draft);
    expect(await db.invoice.findUniqueOrThrow({ where: { id: existing.id }, include: { items: true } })).toEqual(existing);
  });

  it('hai request đồng thời trên kỳ chưa có P101 chỉ tạo đúng một hóa đơn', async () => {
    const responses = await Promise.all([generate(), generate()]);
    expect(responses.map(({ status }) => status).sort()).toEqual([200, 201]);
    const results = await Promise.all(responses.map((response) => response.json()));
    expect(results.map(({ created }) => created).sort()).toEqual([0, 1]);
    expect(await db.invoice.count({ where: { contractId: demo!.p101.id, period: DEMO_PERIOD } })).toBe(1);
  });

  it('chặn sai quyền và đầu vào sai, báo cấu hình thiếu theo tên tòa nhà', async () => {
    const { building, existing, otherOwner, otherBuilding, tenantUser, unsupportedWater, owner } = demo!;
    expect((await get(`/${existing.id}`, otherOwner)).status).toBe(404);
    expect((await get(`?buildingId=${building.id}`, otherOwner)).status).toBe(404);
    expect(await (await get('', otherOwner)).json()).toEqual([]);
    expect((await generate(building.id, otherOwner)).status).toBe(404);
    expect((await generate(building.id, tenantUser)).status).toBe(403);
    expect((await get('', tenantUser)).status).toBe(403);
    expect((await get('/01')).status).toBe(400);
    expect((await get('?buildingId=1e3')).status).toBe(400);
    expect((await get('?status=UNKNOWN')).status).toBe(400);
    expect((await generate(building.id, owner, { buildingId: '1', period: DEMO_PERIOD })).status).toBe(400);
    expect((await generate(building.id, owner, { buildingId: building.id, period: DEMO_PERIOD, totalAmount: 1 })).status).toBe(400);
    for (const [b, account] of [[otherBuilding, otherOwner], [unsupportedWater, owner]] as const) {
      const response = await generate(b.id, account);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR', message: expect.stringContaining(b.name) });
    }
  });

  it('không dùng một chỉ số cho hai hợp đồng nối tiếp của cùng phòng', async () => {
    const { p101 } = demo!;
    await db.contract.update({ where: { id: p101.id }, data: { endDate: new Date('2026-10-15T00:00:00+07:00') } });
    const successor = await db.contract.create({
      data: { roomId: p101.roomId, rentPrice: 3350000, startDate: new Date('2026-10-16T00:00:00+07:00') },
    });
    const response = await generate();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ created: 0, skipped: expect.arrayContaining([
      expect.objectContaining({ contractId: p101.id, reason: 'MULTIPLE_CONTRACTS' }),
      expect.objectContaining({ contractId: successor.id, reason: 'MULTIPLE_CONTRACTS' }),
    ]) });
    expect(await db.invoice.count({ where: { contractId: { in: [p101.id, successor.id] } } })).toBe(0);
  });
});
