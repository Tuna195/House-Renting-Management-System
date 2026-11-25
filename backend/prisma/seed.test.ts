import { beforeEach, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
  building: { findFirst: vi.fn(), create: vi.fn() },
  buildingElectricityTier: { createMany: vi.fn() },
  room: { create: vi.fn(), update: vi.fn() },
  tenant: { create: vi.fn() },
  contract: { create: vi.fn() },
  meterReading: { create: vi.fn() },
  $disconnect: vi.fn(),
}));

vi.mock('@prisma/client', () => ({ PrismaClient: function PrismaClient() { return db; } }));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('demo-password-hash') } }));

const tiers = [{ upTo: 50, price: 2000 }, { upTo: 100, price: 2500 }, { upTo: null, price: 3000 }];

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

async function runSeed() {
  await import('./seed.js');
  await vi.waitFor(() => expect(db.$disconnect).toHaveBeenCalledTimes(1));
}

it('tạo biểu giá cùng Nhà trọ Bách Khoa khi seed DB mới', async () => {
  db.user.findUnique.mockResolvedValue(null);
  db.user.create.mockResolvedValue({ id: 1, fullName: 'Demo' });
  db.building.create.mockResolvedValue({ id: 2, services: [] });
  db.room.create.mockResolvedValue({ id: 3 });
  db.tenant.create.mockResolvedValue({ id: 4 });

  await runSeed();

  expect(db.building.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ name: 'Nhà trọ Bách Khoa', electricityTiers: { create: tiers } }),
  }));
  expect(db.meterReading.create).toHaveBeenCalled();
  expect(db.buildingElectricityTier.createMany).not.toHaveBeenCalled();
});

it('bổ sung biểu giá cho tòa demo cũ chưa có bậc giá, không tạo lại dữ liệu demo', async () => {
  db.user.findUnique.mockResolvedValue({ id: 1 });
  db.building.findFirst.mockResolvedValue({ id: 2 });

  await runSeed();

  expect(db.building.findFirst).toHaveBeenCalledWith({
    where: { ownerId: 1, name: 'Nhà trọ Bách Khoa', electricityTiers: { none: {} } },
    select: { id: true },
  });
  expect(db.buildingElectricityTier.createMany).toHaveBeenCalledWith({
    data: tiers.map((tier) => ({ ...tier, buildingId: 2 })), skipDuplicates: true,
  });
  expect(db.user.create).not.toHaveBeenCalled();
  expect(db.building.create).not.toHaveBeenCalled();
});

it('không ghi thêm khi chạy lại seed và tòa demo đã có biểu giá', async () => {
  db.user.findUnique.mockResolvedValue({ id: 1 });
  db.building.findFirst.mockResolvedValue(null);

  await runSeed();

  expect(db.buildingElectricityTier.createMany).not.toHaveBeenCalled();
  expect(db.user.create).not.toHaveBeenCalled();
  expect(db.building.create).not.toHaveBeenCalled();
});
