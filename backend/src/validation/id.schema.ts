/** Hợp đồng ID dùng chung tại biên HTTP; chỉ dữ liệu đã parse mới được chuyển tới service/Prisma. */
import { z } from 'zod';

export const MAX_DATABASE_ID = 2147483647;

/** ID trong JSON phải là number nguyên dương tương thích PostgreSQL Int, không tự ép kiểu. */
export const databaseIdSchema = z.number({
  invalid_type_error: 'ID phải là số nguyên dương',
  required_error: 'Bắt buộc nhập ID',
}).int('ID phải là số nguyên').min(1, 'ID phải lớn hơn 0')
  .max(MAX_DATABASE_ID, `ID không được vượt quá ${MAX_DATABASE_ID}`);

/**
 * Query/path chỉ nhận chuỗi thập phân chuẩn trước khi đổi sang number.
 * Không trim/coerce: từ chối dấu, số 0 đầu, số mũ, hex, mảng và object thay vì diễn giải thành ID khác.
 * Giới hạn độ dài trước chuyển kiểu để tránh mất chính xác với chuỗi số quá lớn.
 */
export const httpIdSchema = z.string({
  invalid_type_error: 'ID phải là một chuỗi số thập phân',
  required_error: 'Bắt buộc nhập ID',
}).max(10, 'ID vượt giới hạn cho phép')
  .regex(/^[1-9][0-9]*$/, 'ID phải có dạng số thập phân dương, không có số 0 đầu')
  .transform(Number)
  .pipe(databaseIdSchema);
