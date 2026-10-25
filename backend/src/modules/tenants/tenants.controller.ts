import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import { parseId } from '../../utils/app-error';
import * as service from './tenants.service';

export async function list(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.trim();
  res.json(await service.listTenants(currentUser(req).id, q));
}

export async function getOne(req: Request, res: Response) {
  res.json(await service.getTenant(currentUser(req).id, parseId(req.params.id)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createTenant(currentUser(req).id, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateTenant(currentUser(req).id, parseId(req.params.id), req.body));
}

export async function remove(req: Request, res: Response) {
  await service.deleteTenant(currentUser(req).id, parseId(req.params.id));
  res.status(204).end();
}

export async function createAccount(req: Request, res: Response) {
  const tenantId = Number(req.params.id); // Lấy :id từ URL
  const input = req.body; // Lấy { email, password }

  const result = await service.createTenantAccount(currentUser(req).id, tenantId, input);

  res.status(201).json(result);
}
