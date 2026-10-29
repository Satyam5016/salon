import GalleryImage from '../models/GalleryImage.js';

const publicSelect = 'title src alt category sortOrder';
const editableFields = ['title', 'src', 'alt', 'category', 'active', 'sortOrder'];

function galleryPayload(body) {
  const payload = {};
  editableFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = field === 'sortOrder' ? Number(body[field]) : body[field];
  });
  return payload;
}

export async function listPublicGallery(_req, res, next) {
  try {
    const images = await GalleryImage.find({ active: true }).select(publicSelect).sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: images.length, images });
  } catch (error) {
    next(error);
  }
}

export async function listAdminGallery(_req, res, next) {
  try {
    const images = await GalleryImage.find().sort({ active: -1, sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: images.length, images });
  } catch (error) {
    next(error);
  }
}

export async function createGalleryImage(req, res, next) {
  try {
    const image = await GalleryImage.create(galleryPayload(req.body));
    res.status(201).json({ success: true, message: 'Gallery image created successfully', image });
  } catch (error) {
    next(error);
  }
}

export async function updateGalleryImage(req, res, next) {
  try {
    const image = await GalleryImage.findByIdAndUpdate(req.params.id, galleryPayload(req.body), {
      new: true,
      runValidators: true
    });
    if (!image) {
      res.status(404);
      throw new Error('Gallery image not found');
    }
    res.status(200).json({ success: true, message: 'Gallery image updated successfully', image });
  } catch (error) {
    next(error);
  }
}

export async function deleteGalleryImage(req, res, next) {
  try {
    const image = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!image) {
      res.status(404);
      throw new Error('Gallery image not found');
    }
    res.status(200).json({ success: true, message: 'Gallery image deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateGalleryImageStatus(req, res, next) {
  try {
    const image = await GalleryImage.findByIdAndUpdate(req.params.id, { active: Boolean(req.body.active) }, { new: true });
    if (!image) {
      res.status(404);
      throw new Error('Gallery image not found');
    }
    res.status(200).json({
      success: true,
      message: `Gallery image ${image.active ? 'activated' : 'deactivated'} successfully`,
      image
    });
  } catch (error) {
    next(error);
  }
}
