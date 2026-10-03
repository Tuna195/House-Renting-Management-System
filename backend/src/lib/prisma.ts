import { PrismaClient } from '@prisma/client';

// Dùng chung MỘT PrismaClient cho cả ứng dụng (mỗi client giữ một nhóm kết nối tới DB).
export const prisma = new PrismaClient();
