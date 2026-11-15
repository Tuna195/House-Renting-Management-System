import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề cần ít nhất 3 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự'),
  description: z.string().trim().max(1000, 'Mô tả tối đa 1000 ký tự').optional(),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
      { message: 'Định dạng ảnh không hợp lệ (hỗ trợ ảnh tải trực tiếp hoặc link web)' },
    )
    .optional()
    .or(z.literal('')),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
