import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
