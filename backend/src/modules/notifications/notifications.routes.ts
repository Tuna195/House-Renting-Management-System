import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import * as notificationController from './notifications.controller';

const router = Router();

// Toàn bộ API thông báo yêu cầu người dùng phải đăng nhập
router.use(requireAuth);

router.get('/', notificationController.list);
router.post('/read-all', notificationController.markAllRead);
router.post('/:id/read', notificationController.markRead);

export default router;
