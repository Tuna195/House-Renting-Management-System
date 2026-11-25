import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { detail, generate, list } from './invoices.controller';
import { generateInvoicesSchema } from './invoices.schema';

const router = Router();

router.use(requireAuth, requireRole('LANDLORD'));
router.get('/', list);
router.post('/generate', validateBody(generateInvoicesSchema), generate);
router.get('/:id', detail);

export default router;
