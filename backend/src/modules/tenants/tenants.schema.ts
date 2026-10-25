// ⭐ MODULE MẪU — các module khác (rooms, tenants, contracts...) làm theo đúng cấu trúc 4 file này:
//   *.schema.ts      kiểm tra dữ liệu đầu vào (zod)
//   *.service.ts     logic nghiệp vụ + truy vấn DB (KHÔNG đụng tới req/res)
//   *.controller.ts  nhận req, gọi service, trả res
//   *.routes.ts      khai báo đường dẫn + middleware
import { z } from 'zod';

export const createTenantSchema = z.object({
  fullName: z.string().min(5, 'Vui lòng nhập họ tên'),
  phone: z.string().trim().min(9).max(11, 'Vui lòng nhập số điện thoại'),
  email: z.string().trim().nullish(),
  idNumber: z.string().trim().nullish(),
  dateOfBirth: z.coerce.date().nullish(),
  hometown: z.string().nullish(),
  note: z.string().nullish(),
});

// Khi sửa, mọi trường đều không bắt buộc
export const updateTenantSchema = createTenantSchema.partial();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
