import { Router } from 'express';
import {
  createService,
  deleteService,
  listAdminServices,
  updateService,
  updateServiceStatus
} from '../controllers/serviceController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);

router.get('/', listAdminServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.patch('/:id/status', updateServiceStatus);

export default router;
