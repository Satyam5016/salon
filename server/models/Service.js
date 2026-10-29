import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      required: [true, 'Service slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Service slug must be URL friendly']
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
      maxlength: 800
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true,
      maxlength: 60
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: 0
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: 5
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    },
    availableStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
      }
    ]
  },
  {
    timestamps: true
  }
);

serviceSchema.index({ category: 1, active: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
