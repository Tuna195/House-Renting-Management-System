import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './rooms.controller';
import { createRoomSchema, updateRoomSchema } from './rooms.schema';

const router = Router();

// Mọi API phòng: phải đăng nhập và là chủ nhà
router.use(requireAuth, requireRole('LANDLORD'));

router.get('/', controller.list); //                                   GET    /api/rooms?buildingId=1&status=VACANT
router.get('/:id', controller.getOne); //                              GET    /api/rooms/1
router.post('/', validateBody(createRoomSchema), controller.create); //   POST   /api/rooms
router.patch('/:id', validateBody(updateRoomSchema), controller.update); // PATCH  /api/rooms/1
router.delete('/:id', controller.remove); //                           DELETE /api/rooms/1

export default router;
