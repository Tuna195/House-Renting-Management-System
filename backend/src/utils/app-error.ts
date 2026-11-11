import { httpIdSchema } from '../validation/id.schema';

// Lỗi "có chủ đích" trả về cho client với mã HTTP cụ thể.
// Ở bất kỳ đâu trong service/controller chỉ cần:  throw new AppError(404, 'Không tìm thấy phòng')
// errorHandler (middlewares/error-handler.ts) sẽ bắt và trả JSON { message, details }.
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
    public code?: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new AppError(404, `Không tìm thấy ${what}`);

/** Parse ID đường dẫn trước khi gọi service; sai định dạng/phạm vi trả 400, không truy vấn database. */
export function parseId(value: unknown): number {
  const parsed = httpIdSchema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(400, 'ID không hợp lệ', parsed.error.issues.map((issue) => ({
      path: ['id'],
      code: issue.code,
      message: issue.message,
    })));
  }
  return parsed.data;
}
