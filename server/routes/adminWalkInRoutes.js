import { Router } from 'express';
import { createWalkIn } from '../controllers/appointmentController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.post('/', createWalkIn);

export default router;
