import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';

// Route không tồn tại
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Không có API ${req.method} ${req.originalUrl}` });
};

// Nơi DUY NHẤT trả lỗi cho client. Express 5 tự chuyển lỗi từ hàm async vào đây,
// nên trong controller/service chỉ cần `throw`, không cần try/catch.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  // Lỗi thường gặp của Prisma: https://www.prisma.io/docs/orm/reference/error-reference
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ message: 'Dữ liệu bị trùng', details: err.meta });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ message: 'Dữ liệu đang được dùng ở nơi khác, không thể xóa/sửa' });
      return;
    }
  }

  // Body gửi lên không phải JSON hợp lệ
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Body không phải JSON hợp lệ' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
};
