import { Router } from 'express';
import { registerSchema } from '../auth/auth.schema';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './tenants.controller';
import { createTenantSchema, updateTenantSchema } from './tenants.schema';

const router = Router();

// Mọi API tòa nhà: phải đăng nhập và là chủ nhà
router.use(requireAuth, requireRole('LANDLORD'));

router.get('/', controller.list); //                                      GET    /api/tenants/?q
router.get('/:id', controller.getOne); //                                 GET    /api/tenants/1
router.post('/', validateBody(createTenantSchema), controller.create); //  POST   /api/tenants
router.post('/:id/account', validateBody(registerSchema), controller.createAccount); // POST /api/tenants/1/...
router.patch('/:id', validateBody(updateTenantSchema), controller.update); // PATCH  /api/tenants/1
router.delete('/:id', controller.remove); //                              DELETE /api/tenants/1

export default router;
