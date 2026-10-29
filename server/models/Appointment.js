import mongoose from 'mongoose';
import { appointmentSources, appointmentStatuses, notificationStatuses } from './constants.js';

const appointmentSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 100
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      maxlength: 30
    },
    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid customer email']
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Appointment service is required']
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null
    },
    preferredStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required']
    },
    slotTime: {
      type: String,
      required: [true, 'Slot time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Slot time must use HH:mm format']
    },
    estimatedStartTime: {
      type: Date,
      default: null
    },
    estimatedDuration: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: 5
    },
    source: {
      type: String,
      enum: appointmentSources,
      default: 'online'
    },
    status: {
      type: String,
      enum: appointmentStatuses,
      default: 'booked',
      index: true
    },
    queuePosition: {
      type: Number,
      min: 0,
      default: null
    },
    arrivalTime: {
      type: Date,
      default: null
    },
    serviceStartTime: {
      type: Date,
      default: null
    },
    serviceEndTime: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    notificationStatus: {
      browser: {
        type: String,
        enum: notificationStatuses,
        default: 'pending'
      },
      inApp: {
        type: String,
        enum: notificationStatuses,
        default: 'pending'
      }
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index({ bookingDate: 1, slotTime: 1 });
appointmentSchema.index({ staff: 1, bookingDate: 1, status: 1 });
appointmentSchema.index({ customerPhone: 1, bookingDate: -1 });
appointmentSchema.index({ queuePosition: 1, status: 1 });
appointmentSchema.index(
  { staff: 1, bookingDate: 1, slotTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      staff: { $exists: true, $type: 'objectId' },
      status: { $in: ['booked', 'confirmed', 'notified', 'arrived', 'waiting', 'in_service', 'late', 'skipped'] }
    }
  }
);
appointmentSchema.index(
  { staff: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      staff: { $exists: true, $type: 'objectId' },
      status: 'in_service'
    }
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
