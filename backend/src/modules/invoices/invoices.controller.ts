import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import { validationError } from '../../utils/api-errors';
import { invoiceFiltersSchema, invoiceParamsSchema, type GenerateInvoicesInput } from './invoices.schema';
import { generateInvoices, getInvoice, listInvoices } from './invoices.service';

export async function list(req: Request, res: Response) {
  const filters = invoiceFiltersSchema.safeParse(req.query);
  if (!filters.success) throw validationError(filters.error.issues);
  res.json(await listInvoices(currentUser(req).id, filters.data));
}

export async function detail(req: Request, res: Response) {
  const params = invoiceParamsSchema.safeParse(req.params);
  if (!params.success) throw validationError(params.error.issues);
  res.json(await getInvoice(currentUser(req).id, params.data.id));
}

export async function generate(req: Request<Record<string, string>, unknown, GenerateInvoicesInput>, res: Response) {
  const result = await generateInvoices(currentUser(req).id, req.body);
  res.status(result.created > 0 ? 201 : 200).json(result);
}
