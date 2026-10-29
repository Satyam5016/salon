import { Router } from 'express';
import { listCustomers } from '../controllers/customerController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.get('/', listCustomers);

export default router;
