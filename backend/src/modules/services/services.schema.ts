import { z } from 'zod';

export const listServicesQuerySchema = z.object({
  buildingId: z.coerce.number().int().positive(),
});

export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
