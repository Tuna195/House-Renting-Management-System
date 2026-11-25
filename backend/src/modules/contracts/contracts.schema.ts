// ⭐ MODULE MẪU — các module khác (rooms, tenants, contracts...) làm theo đúng cấu trúc 4 file này:
//   *.schema.ts      kiểm tra dữ liệu đầu vào (zod)
//   *.service.ts     logic nghiệp vụ + truy vấn DB (KHÔNG đụng tới req/res)
//   *.controller.ts  nhận req, gọi service, trả res
//   *.routes.ts      khai báo đường dẫn + middleware
import { z } from 'zod';

const MAX_DB_INT = 2_147_483_647;

export const contractStatusSchema = z.enum(['ACTIVE', 'ENDED', 'CANCELLED']);

export const createContractBaseSchema = z.object({
  roomId: z.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  rentPrice: z.number().int().min(0).max(MAX_DB_INT, `Giá thuê không được vượt ${MAX_DB_INT}`),
  deposit: z.number().int().min(0).max(MAX_DB_INT, `Tiền cọc không được vượt ${MAX_DB_INT}`).default(0),
  tenantIds: z
    .array(z.number().int().positive().max(MAX_DB_INT))
    .min(1, 'Cần ít nhất 1 người ở')
    .refine((tenantIds) => new Set(tenantIds).size === tenantIds.length, 'Danh sách người ở không được trùng'),
  primaryTenantId: z.number().int().positive().max(MAX_DB_INT),
  services: z
    .array(
      z.object({
        serviceId: z.number().int().positive().max(MAX_DB_INT),
        quantity: z.number().int().min(1).max(MAX_DB_INT),
      }),
    )
    .refine(
      (services) => new Set(services.map((service) => service.serviceId)).size === services.length,
      'Dịch vụ không được trùng',
    )
    .default([]),
});

const validateDateRange = (data: { startDate?: Date; endDate?: Date }) =>
  !data.startDate || !data.endDate || data.endDate >= data.startDate;

const dateRangeError = {
  message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi',
  path: ['endDate'],
};

export const listContractsQuerySchema = z.object({
  status: contractStatusSchema.optional(),
  buildingId: z.coerce.number().int().positive().optional(),
});

export const endContractSchema = z.object({
  endDate: z.coerce.date(),
});

export const createContractSchema = createContractBaseSchema
  .refine((data) => data.tenantIds.includes(data.primaryTenantId), {
    message: 'Người đại diện phải nằm trong danh sách người ở',
    path: ['primaryTenantId'],
  })
  .refine(validateDateRange, dateRangeError);

export const updateContractSchema = createContractBaseSchema
  .partial()
  .refine((data) => !data.primaryTenantId || !data.tenantIds || data.tenantIds.includes(data.primaryTenantId), {
    message: 'Người đại diện phải nằm trong danh sách người ở',
    path: ['primaryTenantId'],
  })
  .refine(validateDateRange, dateRangeError);

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;
export type EndContractInput = z.infer<typeof endContractSchema>;
