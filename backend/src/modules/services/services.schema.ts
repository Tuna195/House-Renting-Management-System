import { z } from 'zod';

const MAX_DB_INT = 2_147_483_647;

export const createServiceSchema = z.object({
  buildingId: z.number().int().positive('Vui lòng chọn tòa nhà'),
  name: z.string().trim().min(1, 'Vui lòng nhập tên dịch vụ').max(100, 'Tên dịch vụ tối đa 100 ký tự'),
  price: z.number().int('Giá phải là số nguyên').nonnegative('Giá không được âm').max(MAX_DB_INT, 'Giá quá lớn'),
  // PER_ROOM: cố định mỗi phòng · PER_PERSON: nhân số người ở · PER_QUANTITY: nhân số lượng trong hợp đồng (VD 2 xe)
  unit: z.enum(['PER_ROOM', 'PER_PERSON', 'PER_QUANTITY']).default('PER_ROOM'),
  isActive: z.boolean().default(true),
});

// Khi sửa: mọi trường không bắt buộc, KHÔNG cho chuyển dịch vụ sang tòa nhà khác
export const updateServiceSchema = createServiceSchema.omit({ buildingId: true }).partial();

// req.query luôn là chuỗi → z.coerce.number() để đổi "3" thành 3
export const listServicesQuerySchema = z.object({
  buildingId: z.coerce.number().int().positive().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
