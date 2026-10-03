import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import { parseId } from '../../utils/app-error';
import * as service from './buildings.service';

export async function list(req: Request, res: Response) {
  res.json(await service.listBuildings(currentUser(req).id));
}

export async function getOne(req: Request, res: Response) {
  res.json(await service.getBuilding(currentUser(req).id, parseId(req.params.id)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createBuilding(currentUser(req).id, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateBuilding(currentUser(req).id, parseId(req.params.id), req.body));
}

export async function remove(req: Request, res: Response) {
  await service.deleteBuilding(currentUser(req).id, parseId(req.params.id));
  res.status(204).end();
}
