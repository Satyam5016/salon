import mongoose from 'mongoose';

const salonSettingsSchema = new mongoose.Schema(
  {
    salonName: {
      type: String,
      required: [true, 'Salon name is required'],
      trim: true,
      default: 'Bliss Beauty Salon'
    },
    phone: {
      type: String,
      required: [true, 'Salon phone is required'],
      trim: true
    },
    whatsapp: {
      type: String,
      required: [true, 'Salon WhatsApp number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Salon email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid salon email']
    },
    address: {
      type: String,
      required: [true, 'Salon address is required'],
      trim: true
    },
    openingTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Opening time must use HH:mm format']
    },
    closingTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Closing time must use HH:mm format']
    },
    bookingIntervalMinutes: {
      type: Number,
      default: 15,
      min: 5
    },
    gracePeriodMinutes: {
      type: Number,
      default: 10,
      min: 0
    },
    notificationThresholdMinutes: {
      type: Number,
      default: 15,
      min: 0
    },
    selfCheckInWindowMinutes: {
      type: Number,
      default: 30,
      min: 0
    },
    cancellationCutoffMinutes: {
      type: Number,
      default: 60,
      min: 0
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true
    },
    numberOfChairs: {
      type: Number,
      default: 3,
      min: 1
    },
    maxAdvanceBookingDays: {
      type: Number,
      default: 30,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

const SalonSettings = mongoose.model('SalonSettings', salonSettingsSchema);

export default SalonSettings;
