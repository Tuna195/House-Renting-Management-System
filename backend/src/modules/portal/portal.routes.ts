import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './portal.controller';
import { createMaintenanceSchema } from './portal.schema';

const router = Router();

// Mọi API của portal: bắt buộc đăng nhập và phải có vai trò khách thuê (TENANT)
router.use(requireAuth, requireRole('TENANT'));

// GET /api/portal/maintenance — Lấy danh sách yêu cầu sự cố của tôi
router.get('/maintenance', controller.listMaintenance);

// POST /api/portal/maintenance — Gửi yêu cầu sự cố mới
router.post('/maintenance', validateBody(createMaintenanceSchema), controller.createMaintenance);

// GET /api/portal/contract/active — Lấy thông tin phòng và hợp đồng đang thuê
router.get('/contract/active', controller.getActiveContract);


export default router;
