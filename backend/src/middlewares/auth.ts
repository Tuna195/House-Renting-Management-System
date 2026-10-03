import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

export interface AuthUser {
  id: number;
  role: Role;
}

// Khai báo thêm trường req.user cho TypeScript biết
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

// Bắt buộc đăng nhập. Client gửi header:  Authorization: Bearer <token>
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Bạn chưa đăng nhập'));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload & { role: Role };
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'));
  }
};

// Chỉ cho phép một số vai trò. Dùng SAU requireAuth:  router.use(requireAuth, requireRole('LANDLORD'))
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Bạn không có quyền thực hiện thao tác này'));
    }
    next();
  };

// Lấy user hiện tại trong controller (đã qua requireAuth nên chắc chắn có)
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return req.user;
}
