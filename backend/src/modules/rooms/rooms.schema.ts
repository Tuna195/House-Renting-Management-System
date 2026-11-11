import { z } from 'zod';
import { databaseIdSchema, httpIdSchema } from '../../validation/id.schema';

export const createRoomSchema = z.object({
  buildingId: databaseIdSchema,
  name: z.string().trim().min(1, 'Vui lòng nhập tên phòng'),
  floor: z.number().int().min(0, 'Tầng không được âm').nullish(), // nullish: cho phép xóa trắng khi sửa
  area: z.number().positive('Diện tích phải lớn hơn 0').nullish(),
  baseRent: z.number().int().nonnegative('Giá thuê không được âm'),
  maxOccupants: z.number().int().min(1, 'Tối thiểu 1 người').max(10, 'Tối đa 10 người').default(2),
});

// Khi sửa: mọi trường không bắt buộc, KHÔNG cho chuyển phòng sang tòa nhà khác.
// Trạng thái chỉ đổi tay giữa Trống ↔ Sửa chữa; "Đang thuê" do hợp đồng quyết định.
export const updateRoomSchema = createRoomSchema
  .omit({ buildingId: true })
  .partial()
  .extend({ status: z.enum(['VACANT', 'MAINTENANCE']).optional() });

// Query phải đúng định dạng ID trước khi chuyển chuỗi sang number.
export const listRoomsQuerySchema = z.object({
  buildingId: httpIdSchema.optional(),
  status: z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE']).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
