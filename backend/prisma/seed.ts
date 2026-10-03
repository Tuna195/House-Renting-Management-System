// Tạo dữ liệu demo để cả nhóm có sẵn dữ liệu khi code và khi demo.
// Chạy:  npm run db:seed      (hoặc npm run db:reset để xóa sạch DB rồi seed lại)
// Tài khoản demo được liệt kê trong README.md.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = '123456';

function previousPeriod(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'chunha@demo.vn' } });
  if (existing) {
    console.log('ℹ️  Dữ liệu demo đã có. Muốn tạo lại từ đầu: npm run db:reset');
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const landlord = await prisma.user.create({
    data: { email: 'chunha@demo.vn', passwordHash, fullName: 'Nguyễn Văn Chủ', phone: '0912345678', role: 'LANDLORD' },
  });

  const building = await prisma.building.create({
    data: {
      ownerId: landlord.id,
      name: 'Nhà trọ Bách Khoa',
      address: 'Số 1 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',
      electricityPrice: 3500,
      waterPrice: 25000,
      waterBillingType: 'PER_M3',
      invoiceDueDay: 5,
      services: {
        create: [
          { name: 'Internet', price: 100000, unit: 'PER_ROOM' },
          { name: 'Vệ sinh', price: 30000, unit: 'PER_PERSON' },
          { name: 'Gửi xe máy', price: 100000, unit: 'PER_QUANTITY' },
        ],
      },
    },
    include: { services: true },
  });

  await prisma.building.create({
    data: {
      ownerId: landlord.id,
      name: 'Chung cư mini Lê Thanh Nghị',
      address: 'Ngõ 40 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội',
      electricityPrice: 3800,
      waterPrice: 100000,
      waterBillingType: 'PER_PERSON',
    },
  });

  const rooms = await Promise.all(
    ['P101', 'P102', 'P201', 'P202', 'P301', 'P302'].map((name) =>
      prisma.room.create({
        data: {
          buildingId: building.id,
          name,
          floor: Number(name[1]),
          area: 20,
          baseRent: name.startsWith('P3') ? 3_500_000 : 3_000_000,
          maxOccupants: 3,
        },
      }),
    ),
  );

  // Khách thuê có tài khoản đăng nhập cổng khách thuê
  const tenantUser = await prisma.user.create({
    data: { email: 'khach@demo.vn', passwordHash, fullName: 'Trần Thị Thuê', phone: '0987654321', role: 'TENANT' },
  });
  const tenant1 = await prisma.tenant.create({
    data: { ownerId: landlord.id, userId: tenantUser.id, fullName: tenantUser.fullName, phone: '0987654321', hometown: 'Nam Định' },
  });
  const tenant2 = await prisma.tenant.create({
    data: { ownerId: landlord.id, fullName: 'Lê Văn Ở Ghép', phone: '0977000111', hometown: 'Thái Bình' },
  });

  const p101 = rooms[0];
  const contractStart = new Date();
  contractStart.setMonth(contractStart.getMonth() - 3, 1);

  await prisma.contract.create({
    data: {
      roomId: p101.id,
      startDate: contractStart,
      rentPrice: 3_000_000,
      deposit: 3_000_000,
      tenants: {
        create: [
          { tenantId: tenant1.id, isPrimary: true },
          { tenantId: tenant2.id },
        ],
      },
      services: {
        create: building.services.map((s) => ({ serviceId: s.id, quantity: s.unit === 'PER_QUANTITY' ? 2 : 1 })),
      },
    },
  });
  await prisma.room.update({ where: { id: p101.id }, data: { status: 'OCCUPIED' } });

  await prisma.meterReading.create({
    data: {
      roomId: p101.id,
      period: previousPeriod(),
      electricStart: 1250,
      electricEnd: 1380,
      waterStart: 210,
      waterEnd: 215,
      recordedById: landlord.id,
    },
  });

  console.log('✅ Đã tạo dữ liệu demo. Tài khoản: chunha@demo.vn và khach@demo.vn — mật khẩu xem README.md');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
