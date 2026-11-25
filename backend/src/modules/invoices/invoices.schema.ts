import { InvoiceStatus } from '@prisma/client';
import { z } from 'zod';
import { databaseIdSchema, httpIdSchema } from '../../validation/id.schema';

const periodSchema = z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/, 'Kỳ phải có định dạng YYYY-MM');

export const generateInvoicesSchema = z.object({
  buildingId: databaseIdSchema,
  period: periodSchema,
}).strict();

export const invoiceFiltersSchema = z.object({
  buildingId: httpIdSchema.optional(),
  period: periodSchema.optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
}).strict();

export const invoiceParamsSchema = z.object({ id: httpIdSchema });
export type GenerateInvoicesInput = z.infer<typeof generateInvoicesSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
