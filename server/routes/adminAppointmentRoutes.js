import { Router } from 'express';
import {
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  createAdminBooking,
  getAppointment,
  listAppointments,
  markLateAppointment,
  noShowAppointment,
  rescheduleAppointment,
  skipAppointment,
  startAppointment,
  updateAppointment
} from '../controllers/appointmentController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.get('/', listAppointments);
router.post('/', createAdminBooking);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.patch('/:id/reschedule', rescheduleAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/check-in', checkInAppointment);
router.patch('/:id/start', startAppointment);
router.patch('/:id/complete', completeAppointment);
router.patch('/:id/late', markLateAppointment);
router.patch('/:id/skip', skipAppointment);
router.patch('/:id/no-show', noShowAppointment);

export default router;
