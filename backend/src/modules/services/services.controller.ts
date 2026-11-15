import type { Request, Response } from 'express';
import { currentUser } from '../../middlewares/auth';
import { AppError, parseId } from '../../utils/app-error';
import { listServicesQuerySchema } from './services.schema';
import * as service from './services.service';

export async function list(req: Request, res: Response) {
  // Express 5 không cho gán lại req.query → parse ra biến riêng
  const query = listServicesQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new AppError(400, 'Tham số lọc không hợp lệ', query.error.flatten().fieldErrors);
  }
  res.json(await service.listServices(currentUser(req).id, query.data));
}

export async function getOne(req: Request, res: Response) {
  res.json(await service.getService(currentUser(req).id, parseId(req.params.id)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createService(currentUser(req).id, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateService(currentUser(req).id, parseId(req.params.id), req.body));
}

export async function remove(req: Request, res: Response) {
  const result = await service.deleteService(currentUser(req).id, parseId(req.params.id));
  // Xóa hẳn → 204 như mọi API xóa khác; chỉ ẩn → 200 kèm dịch vụ đã cập nhật để frontend báo đúng
  if (result.archived) {
    res.json(result);
    return;
  }
  res.status(204).end();
}
