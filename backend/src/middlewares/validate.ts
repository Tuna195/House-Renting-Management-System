import type { RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { AppError } from '../utils/app-error';

// Thông báo mặc định tiếng Việt cho các lỗi chưa tự đặt message trong schema
z.setErrorMap((issue, ctx) => {
  if (issue.code === 'invalid_type') {
    return { message: issue.received === 'undefined' ? 'Bắt buộc nhập' : 'Sai kiểu dữ liệu' };
  }
  if (issue.code === 'invalid_enum_value') {
    return { message: `Giá trị phải là một trong: ${issue.options.join(', ')}` };
  }
  return { message: ctx.defaultError };
});

// Kiểm tra req.body theo một zod schema trước khi vào controller.
// Dữ liệu sai → trả 400 kèm chi tiết từng trường; đúng → req.body được thay bằng dữ liệu đã làm sạch.
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(400, 'Dữ liệu không hợp lệ', result.error.flatten().fieldErrors));
    }
    req.body = result.data;
    next();
  };
