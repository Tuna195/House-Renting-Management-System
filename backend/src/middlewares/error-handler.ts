import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';
import { defaultErrorCode } from '../utils/api-errors';

// Route không tồn tại
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: `Không có API ${req.method} ${req.path}`, details: [] });
};

// Nơi DUY NHẤT trả lỗi cho client. Express 5 tự chuyển lỗi từ hàm async vào đây,
// nên trong controller/service chỉ cần `throw`, không cần try/catch.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ code: err.code ?? defaultErrorCode(err.status), message: err.message, details: err.details ?? [] });
    return;
  }

  // Lỗi thường gặp của Prisma: https://www.prisma.io/docs/orm/reference/error-reference
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2034') {
      res.status(409).json({ code: 'WRITE_CONFLICT', message: 'Dữ liệu vừa thay đổi, vui lòng thử lưu lại', details: [] });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ code: 'DUPLICATE_RESOURCE', message: 'Dữ liệu bị trùng', details: [] });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu', details: [] });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ code: 'RESOURCE_IN_USE', message: 'Dữ liệu đang được dùng ở nơi khác, không thể xóa/sửa', details: [] });
      return;
    }
  }

  // Body gửi lên không phải JSON hợp lệ
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ code: 'INVALID_JSON', message: 'Body không phải JSON hợp lệ', details: [] });
    return;
  }

  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Lỗi máy chủ', details: [] });
};
