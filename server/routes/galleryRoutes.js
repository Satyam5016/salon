import { Router } from 'express';
import { listPublicGallery } from '../controllers/galleryController.js';

const router = Router();

router.get('/', listPublicGallery);

export default router;
