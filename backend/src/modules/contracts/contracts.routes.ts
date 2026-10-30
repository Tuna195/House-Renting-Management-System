import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './contracts.controller';
import { createContractSchema, endContractSchema, updateContractSchema } from './contracts.schema';

const router = Router();

// Mọi API tòa nhà: phải đăng nhập và là chủ nhà
router.use(requireAuth, requireRole('LANDLORD'));

router.get('/', controller.list); //                                      GET    /api/contracts
router.post('/', validateBody(createContractSchema), controller.create); //  POST   /api/contracts
router.post('/:id/end', validateBody(endContractSchema), controller.end); //  POST   /api/contracts/1/end
router.patch('/:id', validateBody(updateContractSchema), controller.update); // PATCH  /api/contracts/1
router.delete('/:id', controller.remove); //                              DELETE /api/contracts/1

export default router;
