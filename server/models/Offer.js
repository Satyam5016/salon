import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: 120
    },
    value: {
      type: String,
      required: [true, 'Offer value is required'],
      trim: true,
      maxlength: 80
    },
    detail: {
      type: String,
      required: [true, 'Offer detail is required'],
      trim: true,
      maxlength: 500
    },
    expires: {
      type: String,
      required: [true, 'Offer expiry text is required'],
      trim: true,
      maxlength: 120
    },
    image: {
      type: String,
      trim: true,
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

offerSchema.index({ active: 1, sortOrder: 1 });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
