import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './buildings.controller';
import { createBuildingSchema, updateBuildingSchema } from './buildings.schema';

const router = Router();

// Mọi API tòa nhà: phải đăng nhập và là chủ nhà
router.use(requireAuth, requireRole('LANDLORD'));

router.get('/', controller.list); //                                      GET    /api/buildings
router.get('/:id', controller.getOne); //                                 GET    /api/buildings/1
router.post('/', validateBody(createBuildingSchema), controller.create); //  POST   /api/buildings
router.patch('/:id', validateBody(updateBuildingSchema), controller.update); // PATCH  /api/buildings/1
router.delete('/:id', controller.remove); //                              DELETE /api/buildings/1

export default router;
