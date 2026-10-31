import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import * as maintenanceController from './maintenance.controller';

const router = Router();

// Toàn bộ API này dành riêng cho chủ nhà (LANDLORD)
router.use(requireAuth, requireRole('LANDLORD'));

router.get('/', maintenanceController.list);
router.patch('/:id', maintenanceController.updateStatus);

export default router;
