import { Router } from 'express';
import { acknowledgeBrowserNotification } from '../controllers/notificationController.js';

const router = Router();

router.patch('/:id/browser-sent', acknowledgeBrowserNotification);

export default router;
