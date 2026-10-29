import { Router } from 'express';
import { getAvailableSlots } from '../controllers/bookingController.js';

const router = Router();

router.get('/availability', getAvailableSlots);
router.get('/available-slots', getAvailableSlots);

export default router;
