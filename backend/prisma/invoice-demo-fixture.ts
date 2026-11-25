import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const DEMO_PERIOD = '2026-10';
export const DEMO_PASSWORD = 'InvoiceDemo2026!';
export const DEMO_TOTAL = 3_940_000;

export function createInvoiceDemo(db: PrismaClient) {
  const suffix = randomUUID();
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 4);
  return db.$transaction(async (tx) => {
    const [owner, otherOwner, tenantUser] = await Promise.all([
      tx.user.create({ data: { email: `invoice-owner-${suffix}@example.test`, fullName: 'Chủ nhà demo', role: 'LANDLORD', passwordHash } }),
      tx.user.create({ data: { email: `invoice-other-${suffix}@example.test`, fullName: 'Chủ nhà khác', role: 'LANDLORD', passwordHash } }),
      tx.user.create({ data: { email: `invoice-tenant-${suffix}@example.test`, fullName: 'Nguyễn An', role: 'TENANT', passwordHash } }),
    ]);
    const buildingData = { address: 'Địa chỉ demo', electricityPrice: 4000, waterPrice: 25000 };
    const building = await tx.building.create({
      data: {
        ...buildingData,
        name: `Nhà demo hóa đơn ${suffix.slice(0, 8)}`,
        ownerId: owner.id,
        electricityTiers: { create: [{ upTo: 50, price: 2000 }, { upTo: 100, price: 2500 }, { upTo: null, price: 3000 }] },
      },
    });
    const otherBuilding = await tx.building.create({
      data: { ...buildingData, name: 'Tòa nhà chủ khác', ownerId: otherOwner.id },
    });
    const unsupportedWater = await tx.building.create({
      data: {
        ...buildingData, name: 'Tòa nhà nước theo người', ownerId: owner.id, waterBillingType: 'PER_PERSON',
        electricityTiers: { create: { upTo: null, price: 3000 } },
      },
    });
    const tenant = await tx.tenant.create({
      data: { ownerId: owner.id, userId: tenantUser.id, fullName: tenantUser.fullName, phone: '0900000000' },
    });
    const service = await tx.service.create({ data: { buildingId: building.id, name: 'Internet', price: 150000 } });
    const rooms = await Promise.all(['P101', 'P102', 'P103'].map((name) => (
      tx.room.create({ data: { name, buildingId: building.id, baseRent: 3350000 } })
    )));
    const [p101, p102, p103] = await Promise.all(rooms.map((room) => tx.contract.create({
      data: {
        roomId: room.id, rentPrice: room.baseRent, startDate: new Date('2026-10-01T00:00:00+07:00'),
        ...(room.name === 'P101' ? {
          // Hợp đồng kết thúc vào ngày cuối kỳ vẫn đủ tháng.
          status: 'ENDED',
          endDate: new Date('2026-10-31T00:00:00+07:00'),
          tenants: { create: { tenantId: tenant.id, isPrimary: true } },
          services: { create: { serviceId: service.id } },
        } : {}),
      },
    })));
    await tx.meterReading.create({
      data: {
        roomId: p101.roomId, period: DEMO_PERIOD, recordedById: owner.id,
        electricStart: 120, electricEnd: 250, waterStart: 20, waterEnd: 25,
      },
    });
    const existing = await tx.invoice.create({
      data: {
        contractId: p102.id, period: DEMO_PERIOD, totalAmount: 111000,
        dueDate: new Date('2026-11-05T00:00:00+07:00'), paymentCode: `HD${p102.id}202610`,
        items: { create: { type: 'OTHER', description: 'Khoản đã lưu', quantity: 1, unitPrice: 111000, amount: 111000 } },
      },
      include: { items: true },
    });
    return { owner, otherOwner, tenantUser, tenant, building, otherBuilding, unsupportedWater, p101, p102, p103, existing };
  });
}

export type InvoiceDemo = Awaited<ReturnType<typeof createInvoiceDemo>>;

export async function deleteInvoiceDemo(db: PrismaClient, demo: InvoiceDemo) {
  const ownerIds = [demo.owner.id, demo.otherOwner.id];
  const buildings = { ownerId: { in: ownerIds } };
  const rooms = { building: buildings };
  const contracts = { room: rooms };
  await db.$transaction([
    db.payment.deleteMany({ where: { invoice: { contract: contracts } } }),
    db.invoice.deleteMany({ where: { contract: contracts } }),
    db.meterReading.deleteMany({ where: { room: rooms } }),
    db.contract.deleteMany({ where: contracts }),
    db.service.deleteMany({ where: { building: buildings } }),
    db.room.deleteMany({ where: rooms }),
    db.building.deleteMany({ where: buildings }),
    db.tenant.delete({ where: { id: demo.tenant.id } }),
    db.user.deleteMany({ where: { id: { in: [...ownerIds, demo.tenantUser.id] } } }),
  ]);
}
