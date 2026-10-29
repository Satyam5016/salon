import { Router } from 'express';
import { listPublicOffers } from '../controllers/offerController.js';

const router = Router();

router.get('/', listPublicOffers);

export default router;
