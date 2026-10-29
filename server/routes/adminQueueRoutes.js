import { Router } from 'express';
import { getAdminLiveQueue } from '../controllers/queueController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.get('/live', getAdminLiveQueue);

export default router;
