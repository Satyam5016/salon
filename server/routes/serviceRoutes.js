import { Router } from 'express';
import { getServiceById, listPublicServices } from '../controllers/serviceController.js';

const router = Router();

router.get('/', listPublicServices);
router.get('/:id', getServiceById);

export default router;
