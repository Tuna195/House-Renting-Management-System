import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import { AppError, parseId } from '../../utils/app-error';
import * as service from './contracts.service';
import { listContractsQuerySchema, createContractSchema, updateContractSchema, endContractSchema } from './contracts.schema';

export async function list(req: Request, res: Response) {
  const query = listContractsQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new AppError(400, 'Tham số lọc không hợp lệ', query.error.flatten().fieldErrors);
  }
  res.json(await service.listContracts(currentUser(req).id, query.data));
}

export async function create(req: Request, res: Response) {
  const query = createContractSchema.safeParse(req.body);
  if (!query.success) {
    throw new AppError(400, 'Tham số lọc không hợp lệ', query.error.flatten().fieldErrors);
  }
  res.status(201).json(await service.createContract(currentUser(req).id, query.data));
}

export async function update(req: Request, res: Response) {
  const query = updateContractSchema.safeParse(req.body);
  if (!query.success) {
    throw new AppError(400, 'Tham số lọc không hợp lệ', query.error.flatten().fieldErrors);
  }
  res.json(await service.updateContract(currentUser(req).id, parseId(req.params.id), query.data));
}

export async function remove(req: Request, res: Response) {
  await service.deleteContract(currentUser(req).id, parseId(req.params.id));
  res.status(204).end();
}

export async function end(req: Request, res: Response) {
  const body = endContractSchema.safeParse(req.body);
  if (!body.success) {
    throw new AppError(400, 'Dữ liệu không hợp lệ', body.error.flatten().fieldErrors);
  }
  res.json(await service.endContract(currentUser(req).id, parseId(req.params.id), body.data.endDate));
}
