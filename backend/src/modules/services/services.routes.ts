import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './services.controller';
import { createServiceSchema, updateServiceSchema } from './services.schema';

const router = Router();

// Mọi API dịch vụ: phải đăng nhập và là chủ nhà
router.use(requireAuth, requireRole('LANDLORD'));

router.get('/', controller.list); //                                      GET    /api/services?buildingId=1
router.get('/:id', controller.getOne); //                                 GET    /api/services/1
router.post('/', validateBody(createServiceSchema), controller.create); //  POST   /api/services
router.patch('/:id', validateBody(updateServiceSchema), controller.update); // PATCH  /api/services/1
router.delete('/:id', controller.remove); //                              DELETE /api/services/1 (đã dùng → ẩn)

export default router;
