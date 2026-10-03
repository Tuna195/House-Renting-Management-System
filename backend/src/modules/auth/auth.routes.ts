import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/register', validateBody(registerSchema), controller.register);
router.post('/login', validateBody(loginSchema), controller.login);
router.get('/me', requireAuth, controller.me);

export default router;
