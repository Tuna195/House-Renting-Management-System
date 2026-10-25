import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import { AppError, parseId } from '../../utils/app-error';
import { listRoomsQuerySchema } from './rooms.schema';
import * as service from './rooms.service';

export async function list(req: Request, res: Response) {
  // Express 5 không cho gán lại req.query → parse ra biến riêng
  const query = listRoomsQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new AppError(400, 'Tham số lọc không hợp lệ', query.error.flatten().fieldErrors);
  }
  res.json(await service.listRooms(currentUser(req).id, query.data));
}

export async function getOne(req: Request, res: Response) {
  res.json(await service.getRoom(currentUser(req).id, parseId(req.params.id)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createRoom(currentUser(req).id, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateRoom(currentUser(req).id, parseId(req.params.id), req.body));
}

export async function remove(req: Request, res: Response) {
  await service.deleteRoom(currentUser(req).id, parseId(req.params.id));
  res.status(204).end();
}
