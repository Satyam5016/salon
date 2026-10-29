import { Router } from 'express';
import {
  createGalleryImage,
  deleteGalleryImage,
  listAdminGallery,
  updateGalleryImage,
  updateGalleryImageStatus
} from '../controllers/galleryController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protectAdmin);
router.get('/', listAdminGallery);
router.post('/', createGalleryImage);
router.put('/:id', updateGalleryImage);
router.delete('/:id', deleteGalleryImage);
router.patch('/:id/status', updateGalleryImageStatus);

export default router;
