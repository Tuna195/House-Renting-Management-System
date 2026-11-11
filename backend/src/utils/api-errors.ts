/** Chuẩn hóa mã lỗi và chi tiết validation mà không đưa input/metadata nhạy cảm vào response. */
import type { ZodIssue } from 'zod';
import { AppError } from './app-error';

export interface FieldIssue {
  path: (string | number)[];
  code: string;
  message: string;
  roomId?: number;
}

/** Chỉ giữ vị trí, mã và thông báo; không trả nguyên Zod issue chứa dữ liệu/schema nội bộ. */
export function validationError(issues: ZodIssue[], message = 'Dữ liệu không hợp lệ'): AppError {
  return new AppError(400, message, issues.map(({ path, code, message }) => ({ path, code, message })), 'VALIDATION_ERROR');
}

/** Mã mặc định ổn định cho lỗi nghiệp vụ cũ chưa khai báo mã cụ thể. */
export function defaultErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: 'VALIDATION_ERROR', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN',
    404: 'NOT_FOUND', 409: 'CONFLICT',
  };
  return codes[status] ?? 'INTERNAL_ERROR';
}
