import { z } from 'zod';

export const updateMaintenanceStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'DONE', 'REJECTED'], {
    errorMap: () => ({ message: 'Trạng thái chuyển tiếp phải là IN_PROGRESS, DONE hoặc REJECTED' }),
  }),
});

export type UpdateMaintenanceStatusInput = z.infer<typeof updateMaintenanceStatusSchema>;
