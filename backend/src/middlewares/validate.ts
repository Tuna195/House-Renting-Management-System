import type { RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { validationError } from '../utils/api-errors';

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
// Dữ liệu sai → trả 400 kèm chi tiết có path/code/message của từng trường; đúng → req.body được thay bằng dữ liệu đã làm sạch.
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(validationError(result.error.issues));
    }
    req.body = result.data;
    next();
  };
