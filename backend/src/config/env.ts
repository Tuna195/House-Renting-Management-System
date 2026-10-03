import 'dotenv/config';
import { z } from 'zod';

// Đọc và kiểm tra biến môi trường ngay khi khởi động.
// Thiếu biến nào thì server dừng luôn và báo rõ, thay vì chạy rồi lỗi khó hiểu về sau.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'Chưa khai báo DATABASE_URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET phải dài ít nhất 16 ký tự'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ File backend/.env thiếu hoặc sai. Xem backend/.env.example');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
