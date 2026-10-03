// ⭐ MODULE MẪU — các module khác (rooms, tenants, contracts...) làm theo đúng cấu trúc 4 file này:
//   *.schema.ts      kiểm tra dữ liệu đầu vào (zod)
//   *.service.ts     logic nghiệp vụ + truy vấn DB (KHÔNG đụng tới req/res)
//   *.controller.ts  nhận req, gọi service, trả res
//   *.routes.ts      khai báo đường dẫn + middleware
import { z } from 'zod';

export const createBuildingSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên tòa nhà'),
  address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ'),
  description: z.string().trim().optional(),
  electricityPrice: z.number().int().nonnegative('Giá điện không được âm'),
  waterPrice: z.number().int().nonnegative('Giá nước không được âm'),
  waterBillingType: z.enum(['PER_M3', 'PER_PERSON']).default('PER_M3'),
  invoiceDueDay: z.number().int().min(1).max(28).default(5),
});

// Khi sửa, mọi trường đều không bắt buộc
export const updateBuildingSchema = createBuildingSchema.partial();

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
