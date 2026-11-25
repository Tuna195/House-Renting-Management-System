import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { buildInvoiceItems, sumItems } from '../billing/billing';
import { coversEntireInvoicePeriod, hasValidElectricityTiers, invoiceDueDate, invoicePeriod, toInvoiceInput } from './invoices.input';
import type { GenerateInvoicesInput, InvoiceFilters } from './invoices.schema';

const invoiceFields = {
  id: true,
  contractId: true,
  period: true,
  status: true,
  totalAmount: true,
  paidAmount: true,
  dueDate: true,
} satisfies Prisma.InvoiceSelect;

function invoiceContractFields(ownerId: number) {
  return {
    select: {
      room: { select: { id: true, name: true, building: { select: { id: true, name: true } } } },
      tenants: {
        where: { isPrimary: true, tenant: { ownerId } },
        select: { tenant: { select: { id: true, fullName: true } } },
        orderBy: { tenantId: 'asc' },
        take: 1,
      },
    },
  } satisfies Prisma.ContractDefaultArgs;
}

type InvoiceWithContract = Prisma.InvoiceGetPayload<{
  select: typeof invoiceFields & { contract: ReturnType<typeof invoiceContractFields> };
}>;

function presentInvoice<T extends InvoiceWithContract>({ contract, ...invoice }: T) {
  const { building, ...room } = contract.room;
  return { ...invoice, building, room, primaryTenant: contract.tenants[0]?.tenant ?? null };
}

function ownerRoom(ownerId: number, buildingId?: number) {
  return { buildingId, building: { ownerId } };
}

export async function listInvoices(ownerId: number, { buildingId, period, status }: InvoiceFilters) {
  if (buildingId !== undefined && !await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
    select: { id: true },
  })) throw new AppError(404, 'Không tìm thấy tòa nhà');

  const invoices = await prisma.invoice.findMany({
    where: { period, status, contract: { room: ownerRoom(ownerId, buildingId) } },
    select: { ...invoiceFields, contract: invoiceContractFields(ownerId) },
    orderBy: [{ period: 'desc' }, { id: 'desc' }],
  });
  return invoices.map(presentInvoice);
}

export async function getInvoice(ownerId: number, id: number) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, contract: { room: ownerRoom(ownerId) } },
    select: {
      ...invoiceFields,
      issuedAt: true,
      paymentCode: true,
      note: true,
      contract: invoiceContractFields(ownerId),
      items: {
        select: { id: true, type: true, description: true, quantity: true, unitPrice: true, amount: true },
        orderBy: { id: 'asc' },
      },
      payments: {
        select: { id: true, amount: true, method: true, paidAt: true, note: true },
        orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
      },
    },
  });
  if (!invoice) throw new AppError(404, 'Không tìm thấy hóa đơn');
  return presentInvoice(invoice);
}

type ContractReference = { roomId: number; roomName: string; contractId: number };
type SkipReason = 'ALREADY_EXISTS' | 'MULTIPLE_CONTRACTS' | 'PARTIAL_PERIOD';
type GenerationResult = {
  created: number;
  skipped: (ContractReference & { reason: SkipReason })[];
  missingReadings: ContractReference[];
};

export async function generateInvoices(ownerId: number, { buildingId, period }: GenerateInvoicesInput): Promise<GenerationResult> {
  const scope = ownerRoom(ownerId, buildingId);
  const building = await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
    select: {
      name: true, waterPrice: true, waterBillingType: true, invoiceDueDay: true,
      electricityTiers: { select: { upTo: true, price: true }, orderBy: { upTo: { sort: 'asc', nulls: 'last' } } },
    },
  });
  if (!building) throw new AppError(404, 'Không tìm thấy tòa nhà');
  if (!hasValidElectricityTiers(building.electricityTiers)) {
    throw new AppError(400, `Tòa nhà “${building.name}” chưa có bảng giá điện bậc thang hợp lệ`);
  }
  if (building.waterBillingType !== 'PER_M3') {
    throw new AppError(400, `Tòa nhà “${building.name}” cần cấu hình tính tiền nước theo m³`);
  }
  if (!Number.isInteger(building.invoiceDueDay) || building.invoiceDueDay < 1 || building.invoiceDueDay > 28) {
    throw new AppError(400, `Ngày đóng tiền của tòa nhà “${building.name}” phải từ 1 đến 28`);
  }

  const bounds = invoicePeriod(period);
  const [contracts, readings] = await Promise.all([
    prisma.contract.findMany({
      where: {
        room: scope,
        status: { in: ['ACTIVE', 'ENDED'] },
        startDate: { lt: bounds.next },
        OR: [{ endDate: null }, { endDate: { gte: bounds.start } }],
      },
      select: {
        id: true, startDate: true, endDate: true, rentPrice: true, roomId: true,
        room: { select: { name: true } },
        services: {
          select: { service: { select: { name: true, price: true, buildingId: true } } },
          orderBy: { serviceId: 'asc' },
        },
        invoices: { where: { period }, select: { id: true } },
      },
      orderBy: [{ roomId: 'asc' }, { id: 'asc' }],
    }),
    prisma.meterReading.findMany({
      where: { period, room: scope },
      select: { roomId: true, period: true, electricStart: true, electricEnd: true, waterStart: true, waterEnd: true },
    }),
  ]);
  const readingsByRoom = new Map(readings.map((reading) => [reading.roomId, reading]));
  const contractsPerRoom = new Map<number, number>();
  for (const { roomId } of contracts) contractsPerRoom.set(roomId, (contractsPerRoom.get(roomId) ?? 0) + 1);

  const result: GenerationResult = { created: 0, skipped: [], missingReadings: [] };
  const drafts: { reference: ContractReference; data: Prisma.InvoiceCreateInput }[] = [];
  for (const contract of contracts) {
    const reference = { roomId: contract.roomId, roomName: contract.room.name, contractId: contract.id };
    if (contract.invoices.length) {
      result.skipped.push({ ...reference, reason: 'ALREADY_EXISTS' });
      continue;
    }
    if ((contractsPerRoom.get(contract.roomId) ?? 0) > 1) {
      result.skipped.push({ ...reference, reason: 'MULTIPLE_CONTRACTS' });
      continue;
    }
    const reading = readingsByRoom.get(contract.roomId);
    if (!reading) {
      result.missingReadings.push(reference);
      continue;
    }
    if (!coversEntireInvoicePeriod(contract, bounds)) {
      result.skipped.push({ ...reference, reason: 'PARTIAL_PERIOD' });
      continue;
    }
    if (contract.services.some(({ service }) => service.buildingId !== buildingId)) {
      throw new AppError(400, `Phòng “${reference.roomName}” có dịch vụ không thuộc tòa nhà`);
    }
    try {
      const items = buildInvoiceItems(toInvoiceInput(contract, reading, building, period));
      drafts.push({
        reference,
        data: {
          contract: { connect: { id: contract.id, room: scope } },
          period,
          status: 'DRAFT',
          totalAmount: sumItems(items),
          paymentCode: `HD${contract.id}${period.replace('-', '')}`,
          dueDate: invoiceDueDate(period, building.invoiceDueDay),
          items: { create: items },
        },
      });
    } catch (error) {
      const reason = error instanceof Error && error.message
        ? error.message
        : 'Kiểm tra chỉ số và các khoản tiền';
      throw new AppError(400, `Không tính được hóa đơn phòng “${reference.roomName}” kỳ ${period}: ${reason}`);
    }
  }

  for (const { reference, data } of drafts) {
    try {
      await prisma.$transaction((tx) => tx.invoice.create({ data, select: { id: true } }));
      result.created++;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      // PostgreSQL hủy transaction khi vi phạm unique. Kiểm tra bản thắng ngoài transaction đó.
      const existing = await prisma.invoice.findFirst({
        where: { contractId: reference.contractId, period, contract: { room: scope } },
        select: { id: true },
      });
      if (!existing) throw error;
      result.skipped.push({ ...reference, reason: 'ALREADY_EXISTS' });
    }
  }
  return result;
}
