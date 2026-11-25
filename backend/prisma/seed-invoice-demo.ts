import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createInvoiceDemo, DEMO_PASSWORD, DEMO_PERIOD, DEMO_TOTAL } from './invoice-demo-fixture';

async function main() {
  const url = process.env.INVOICE_TEST_DATABASE_URL;
  if (!url) throw new Error('Hãy đặt INVOICE_TEST_DATABASE_URL trỏ tới PostgreSQL dành riêng cho demo.');
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    const { owner, building } = await createInvoiceDemo(db);
    console.log({
      email: owner.email,
      password: DEMO_PASSWORD,
      buildingId: building.id,
      building: building.name,
      period: DEMO_PERIOD,
      expectedP101Total: DEMO_TOTAL,
    });
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
