import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../utils/app-error';
import type { CreateContractInput, UpdateContractInput, ListContractsQuery } from './contracts.schema';

export function listContracts(ownerId: number, query: ListContractsQuery) {
  return prisma.contract.findMany({
    where: {
      // Luôn lọc theo chủ sở hữu (thông qua phòng -> tòa nhà)
      room: { building: { ownerId } },
      ...(query.buildingId && { room: { buildingId: query.buildingId, building: { ownerId } } }),
      ...(query.status && { status: query.status }),
    },
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
    include: {
      room: { select: { id: true, name: true, building: { select: { id: true, name: true } } } },
      tenants: {
        include: { tenant: { select: { id: true, fullName: true, phone: true } } },
      },
      services: {
        include: { service: true },
      },
    },
  });
}

export async function createContract(ownerId: number, input: CreateContractInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Kiểm tra phòng có tồn tại, thuộc quyền sở hữu và đang VACANT không
    const room = await tx.room.findFirst({
      where: {
        id: input.roomId,
        building: { ownerId }, // Bảo mật: phòng phải của chủ nhà này
      },
    });

    if (!room) throw notFound('Phòng');
    if (room.status !== 'VACANT') {
      throw new AppError(409, 'Phòng này hiện không còn trống để tạo hợp đồng');
    }

    // 2. Kiểm tra xem phòng có hợp đồng nào đang ACTIVE không (Check lại trong transaction để tránh race condition)
    const activeContract = await tx.contract.findFirst({
      where: { roomId: input.roomId, status: 'ACTIVE' },
    });
    if (activeContract) {
      throw new AppError(409, 'Phòng này đã có hợp đồng đang hiệu lực');
    }

    // 3. Kiểm tra sức chứa (maxOccupants)
    if (input.tenantIds.length > room.maxOccupants) {
      throw new AppError(400, `Phòng này chỉ cho phép tối đa ${room.maxOccupants} người`);
    }

    // 4. Kiểm tra tất cả khách thuê có thuộc quyền quản lý của chủ nhà không
    const validTenants = await tx.tenant.count({
      where: {
        id: { in: input.tenantIds },
        ownerId,
      },
    });
    if (validTenants !== input.tenantIds.length) {
      throw new AppError(400, 'Một hoặc nhiều khách thuê không hợp lệ hoặc không thuộc quyền quản lý của bạn');
    }

    // 5. Kiểm tra dịch vụ có thuộc tòa nhà của phòng không
    if (input.services.length > 0) {
      const validServices = await tx.service.count({
        where: {
          id: { in: input.services.map((s) => s.serviceId) },
          buildingId: room.buildingId,
          isActive: true,
        },
      });
      if (validServices !== input.services.length) {
        throw new AppError(400, 'Một hoặc nhiều dịch vụ không hoạt động hoặc không thuộc tòa nhà của phòng này');
      }
    }

    // 6. Tạo hợp đồng và các bảng liên quan
    const contract = await tx.contract.create({
      data: {
        roomId: input.roomId,
        startDate: input.startDate,
        endDate: input.endDate,
        rentPrice: input.rentPrice,
        deposit: input.deposit,
        // Tạo danh sách người ở
        tenants: {
          create: input.tenantIds.map((id) => ({
            tenantId: id,
            isPrimary: id === input.primaryTenantId,
          })),
        },
        // Tạo danh sách dịch vụ đi kèm
        services: {
          create: input.services.map((s) => ({
            serviceId: s.serviceId,
            quantity: s.quantity,
          })),
        },
      },
      include: {
        tenants: true,
        services: true,
      },
    });

    // 7. Cập nhật trạng thái phòng thành OCCUPIED
    await tx.room.update({
      where: { id: input.roomId },
      data: { status: 'OCCUPIED' },
    });

    return contract;
  });
}

export async function updateContract(ownerId: number, id: number, input: UpdateContractInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Kiểm tra hợp đồng tồn tại và thuộc quyền
    const contract = await tx.contract.findFirst({
      where: { id, room: { building: { ownerId } } },
    });
    if (!contract) throw notFound('Hợp đồng');

    // 2. Nếu có cập nhật dịch vụ, xử lý xóa cũ tạo mới (hoặc update tùy logic)
    // Ở đây dùng cách đơn giản: Xóa hết dịch vụ cũ, tạo lại dịch vụ mới nếu có gửi lên
    if (input.services) {
      await tx.contractService.deleteMany({ where: { contractId: id } });
      await tx.contractService.createMany({
        data: input.services.map((s) => ({
          contractId: id,
          serviceId: s.serviceId,
          quantity: s.quantity,
        })),
      });
    }

    // 3. Cập nhật thông tin cơ bản của hợp đồng
    return tx.contract.update({
      where: { id },
      data: {
        endDate: input.endDate,
        rentPrice: input.rentPrice,
        deposit: input.deposit,
        // Không cập nhật roomId hay tenants ở đây
      },
    });
  });
}

export async function deleteContract(ownerId: number, id: number) {
  return await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.findFirst({
      where: { id, room: { building: { ownerId } } },
      include: { invoices: true },
    });
    if (!contract) throw notFound('Hợp đồng');

    // Chặn xóa nếu đã có hóa đơn
    if (contract.invoices.length > 0) {
      throw new AppError(409, 'Không thể xóa hợp đồng đã phát sinh hóa đơn');
    }

    // Nếu hợp đồng đang ACTIVE, khi xóa phải trả phòng về VACANT
    if (contract.status === 'ACTIVE') {
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: 'VACANT' },
      });
    }

    // Xóa hợp đồng (Prisma sẽ tự cascade xóa ContractTenant và ContractService nếu schema có onDelete: Cascade)
    await tx.contract.delete({ where: { id } });
  });
}

/**
 * ⭐ KẾT THÚC HỢP ĐỒNG (Theo yêu cầu file)
 */
export async function endContract(ownerId: number, id: number, endDate: Date) {
  return await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.findFirst({
      where: { id, room: { building: { ownerId } } },
    });
    if (!contract) throw notFound('Hợp đồng');
    if (contract.status !== 'ACTIVE') {
      throw new AppError(400, 'Chỉ có thể kết thúc hợp đồng đang hiệu lực');
    }
    if (endDate < contract.startDate) {
      throw new AppError(400, 'Ngày kết thúc phải từ ngày bắt đầu trở đi');
    }

    // Cập nhật hợp đồng thành ENDED
    const updated = await tx.contract.update({
      where: { id },
      data: { status: 'ENDED', endDate },
    });

    // Trả phòng về VACANT
    await tx.room.update({
      where: { id: contract.roomId },
      data: { status: 'VACANT' },
    });

    return updated;
  });
}
