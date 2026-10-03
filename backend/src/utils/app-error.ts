// Lỗi "có chủ đích" trả về cho client với mã HTTP cụ thể.
// Ở bất kỳ đâu trong service/controller chỉ cần:  throw new AppError(404, 'Không tìm thấy phòng')
// errorHandler (middlewares/error-handler.ts) sẽ bắt và trả JSON { message, details }.
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new AppError(404, `Không tìm thấy ${what}`);

// Chuyển req.params.id (chuỗi) thành số nguyên dương, sai thì báo 400.
export function parseId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'ID không hợp lệ');
  }
  return id;
}
