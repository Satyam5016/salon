import { Router } from 'express';
import {
  cancelCustomerAppointment,
  createAppointment,
  rescheduleCustomerAppointment,
  selfCheckIn,
  trackCustomerAppointment
} from '../controllers/appointmentController.js';
import { getCustomerQueueStatus } from '../controllers/queueController.js';

const router = Router();

router.post('/track', trackCustomerAppointment);
router.post('/self-check-in', selfCheckIn);
router.patch('/:id/cancel', cancelCustomerAppointment);
router.patch('/:id/reschedule', rescheduleCustomerAppointment);
router.get('/:id/queue-status', getCustomerQueueStatus);
router.post('/', createAppointment);

export default router;
