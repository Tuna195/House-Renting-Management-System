import type { MaintenanceStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import { updateMaintenanceStatusSchema } from './maintenance.schema';
import * as maintenanceService from './maintenance.service';

export async function list(req: Request, res: Response) {
  const status = req.query.status as MaintenanceStatus | undefined;
  const buildingId = req.query.buildingId ? Number(req.query.buildingId) : undefined;

  const requests = await maintenanceService.listMaintenance(req.user!.id, {
    status,
    buildingId,
  });

  res.json(requests);
}

export async function updateStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const input = updateMaintenanceStatusSchema.parse(req.body);

  const updated = await maintenanceService.updateMaintenanceStatus(
    req.user!.id,
    id,
    input.status,
  );

  res.json(updated);
}
