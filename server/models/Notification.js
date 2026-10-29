import mongoose from 'mongoose';

const notificationChannels = ['in_app', 'browser', 'email', 'sms', 'whatsapp'];
const notificationStatuses = ['pending', 'sent', 'failed', 'skipped'];
const notificationTypes = [
  'booking_confirmed',
  'two_customers_ahead',
  'one_customer_ahead',
  'turn_available',
  'customer_skipped',
  'no_show',
  'queue_next'
];

const channelStatusSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: notificationChannels,
      required: true
    },
    status: {
      type: String,
      enum: notificationStatuses,
      default: 'pending'
    },
    sentAt: {
      type: Date,
      default: null
    },
    error: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true
    },
    bookingReference: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    channels: {
      type: [channelStatusSchema],
      default: () => [
        { channel: 'in_app', status: 'sent', sentAt: new Date() },
        { channel: 'browser', status: 'pending' }
      ]
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ appointment: 1, type: 1 }, { unique: true });
notificationSchema.index({ bookingReference: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
