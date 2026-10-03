import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../middlewares/auth';
import { AppError, notFound } from '../../utils/app-error';
import type { LoginInput, RegisterInput } from './auth.schema';

// Các trường được phép trả về client — tuyệt đối không trả passwordHash
const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

// Đăng ký công khai chỉ dành cho CHỦ NHÀ.
// Tài khoản khách thuê do chủ nhà tạo (nhiệm vụ của TV2 — xem docs/ke-hoach/tuan-03.md).
export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'Email đã được sử dụng');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
      fullName: input.fullName,
      phone: input.phone,
      role: 'LANDLORD',
    },
    select: publicUserSelect,
  });

  return { user, token: signToken(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Cùng một thông báo cho cả "sai email" và "sai mật khẩu" để kẻ xấu không dò được email nào tồn tại
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'Email hoặc mật khẩu không đúng');
  }

  const { passwordHash: _omit, updatedAt: _u, ...publicUser } = user;
  return { user: publicUser, token: signToken(user) };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw notFound('tài khoản');
  return user;
}
