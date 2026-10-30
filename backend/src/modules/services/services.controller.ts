import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import { AppError } from '../../utils/app-error';
import * as service from './services.service';
import { listServicesQuerySchema } from './services.schema';

export async function list(req: Request, res: Response) {
  const query = listServicesQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new AppError(400, 'Tham số lọc không hợp lệ', query.error.flatten().fieldErrors);
  }
  res.json(await service.listServices(currentUser(req).id, query.data));
}
