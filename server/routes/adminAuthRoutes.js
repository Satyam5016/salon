import { Router } from 'express';
import { getCurrentAdmin, loginAdmin, logoutAdmin } from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import { loginRateLimiter } from '../middleware/securityMiddleware.js';

const router = Router();

router.post('/login', loginRateLimiter, loginAdmin);
router.get('/me', protectAdmin, getCurrentAdmin);
router.post('/logout', protectAdmin, logoutAdmin);

export default router;
