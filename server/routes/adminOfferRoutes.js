import { Router } from 'express';
import {
  createOffer,
  deleteOffer,
  listAdminOffers,
  updateOffer,
  updateOfferStatus
} from '../controllers/offerController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.get('/', listAdminOffers);
router.post('/', createOffer);
router.put('/:id', updateOffer);
router.delete('/:id', deleteOffer);
router.patch('/:id/status', updateOfferStatus);

export default router;
