import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Gallery image title is required'],
      trim: true,
      maxlength: 120
    },
    src: {
      type: String,
      required: [true, 'Gallery image URL is required'],
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: 'Salon'
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 180,
      default: ''
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

galleryImageSchema.index({ active: 1, sortOrder: 1 });

const GalleryImage = mongoose.model('GalleryImage', galleryImageSchema);

export default GalleryImage;
