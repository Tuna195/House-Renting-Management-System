import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import * as controller from './services.controller';

const router = Router();

router.use(requireAuth, requireRole('LANDLORD'));
router.get('/', controller.list);

export default router;
