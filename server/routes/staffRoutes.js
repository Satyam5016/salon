import { Router } from 'express';
import { listPublicStaff } from '../controllers/staffController.js';

const router = Router();

router.get('/', listPublicStaff);

export default router;
