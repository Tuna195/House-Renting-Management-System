import bcrypt from 'bcryptjs';
import { RegisterInput } from '../auth/auth.schema';
import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../utils/app-error';
import type { CreateTenantInput, UpdateTenantInput } from './tenants.schema';

// QUY TẮC BẢO MẬT QUAN TRỌNG: mọi truy vấn đều lọc theo ownerId.
// Nếu chỉ tìm theo id, chủ nhà A có thể xem/sửa tòa nhà của chủ nhà B bằng cách đổi số trên URL.

export function listTenants(ownerId: number, q?: string) {
  return prisma.tenant.findMany({
    where: {
      ownerId,
      ...(q && { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }),
    },
  });
}

export async function getTenant(ownerId: number, id: number) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      ownerId,
      id,
    },
  });
  if (!tenant) throw notFound('người thuê');
  return tenant;
}

export function createTenant(ownerId: number, input: CreateTenantInput) {
  return prisma.tenant.create({ data: { ...input, ownerId } });
}

export async function updateTenant(ownerId: number, id: number, input: UpdateTenantInput) {
  const tenant = await getTenant(ownerId, id);
  return prisma.tenant.update({ where: { id }, data: input });
}

export async function deleteTenant(ownerId: number, id: number) {
  // 1. Kiểm tra tenant tồn tại và thuộc quyền sở hữu
  const tenant = await getTenant(ownerId, id);

  // 2. Kiểm tra xem tenant có hợp đồng nào không
  const contractExists = await prisma.contractTenant.findFirst({
    where: {
      tenantId: id,
      // Có thể cần lọc thêm ownerId của contract nếu bảng Contract có cột này
    }, // Chỉ cần lấy id để kiểm tra tồn tại cho nhẹ
  });

  if (contractExists) {
    // Trả về lỗi 409 Conflict
    throw new AppError(409, 'Không thể xóa người thuê vì đã có hợp đồng liên quan');
  }

  // 3. Nếu không có hợp đồng, tiến hành xóa
  await prisma.tenant.delete({ where: { id } });
}

export async function createTenantAccount(ownerId: number, tenantId: number, input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'Email đã được sử dụng');

  // 1. Hash mật khẩu
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // 2. Sử dụng Transaction để tạo User và gán vào Tenant
  const result = await prisma.$transaction(async (tx) => {
    // Tạo User mới với role TENANT
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        fullName: input.fullName,
        phone: input.phone,
        role: 'TENANT',
      },
    });

    // Cập nhật tenant.userId
    const updatedTenant = await tx.tenant.update({
      where: { id: tenantId },
      data: { userId: newUser.id },
    });

    return { user: newUser, tenant: updatedTenant };
  });

  // (Tuỳ chọn) Xoá password khỏi object trả về trước khi gửi cho client
  const { passwordHash, ...userWithoutPassword } = result.user;

  return { ...result, user: userWithoutPassword };
}
