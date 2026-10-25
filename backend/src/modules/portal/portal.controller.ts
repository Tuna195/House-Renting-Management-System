import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import * as service from './portal.service';

export async function listMaintenance(req: Request, res: Response) {
  const user = currentUser(req);
  const items = await service.listMyMaintenance(user.id);
  res.json(items);
}

export async function createMaintenance(req: Request, res: Response) {
  const user = currentUser(req);
  const item = await service.createMaintenance(user.id, req.body);
  res.status(201).json(item);
}

export async function getActiveContract(req: Request, res: Response) {
  const user = currentUser(req);
  const contract = await service.findActiveContractOfUser(user.id);
  res.json(contract);
}

