import { Router } from 'express';
import { createStaff, deleteStaff, listAdminStaff, updateStaff, updateStaffStatus } from '../controllers/staffController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.get('/', listAdminStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);
router.patch('/:id/status', updateStaffStatus);

export default router;
