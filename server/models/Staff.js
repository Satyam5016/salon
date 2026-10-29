import mongoose from 'mongoose';
import { workingDays } from './constants.js';

const workingHoursSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must use HH:mm format']
    },
    end: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must use HH:mm format']
    }
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
      maxlength: 100
    },
    phone: {
      type: String,
      required: [true, 'Staff phone is required'],
      trim: true,
      maxlength: 30
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid staff email']
    },
    photo: {
      type: String,
      trim: true,
      default: ''
    },
    specialization: {
      type: String,
      required: [true, 'Staff specialization is required'],
      trim: true,
      maxlength: 120
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ],
    workingDays: [
      {
        type: String,
        enum: workingDays
      }
    ],
    workingHours: {
      type: workingHoursSchema,
      required: true,
      default: () => ({ start: '09:00', end: '18:00' })
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

staffSchema.index({ active: 1, specialization: 1 });
staffSchema.index({ email: 1 }, { unique: true, sparse: true });

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
