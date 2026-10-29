import Notification from '../models/Notification.js';
import Appointment from '../models/Appointment.js';
import { now as currentDate } from '../utils/clock.js';

const customerQueueStatuses = ['booked', 'confirmed', 'notified', 'late', 'skipped'];

const notificationTemplates = {
  booking_confirmed: () => ({
    title: 'Booking confirmed',
    message: 'Your appointment at Bliss Beauty Salon is confirmed.'
  }),
  two_customers_ahead: ({ estimatedWaitMinutes }) => ({
    title: 'Two customers ahead',
    message: `There are 2 customers ahead of you. Estimated wait: ${estimatedWaitMinutes} minutes.`
  }),
  one_customer_ahead: () => ({
    title: 'One customer ahead',
    message: "You're next. Please start heading to Bliss Beauty Salon."
  }),
  turn_available: () => ({
    title: 'It is your turn',
    message: "It's your turn. Please check in now."
  }),
  customer_skipped: () => ({
    title: 'Booking moved back',
    message: "We couldn't find you when your turn became available. Your booking has been moved back in the queue."
  }),
  no_show: () => ({
    title: 'Appointment no-show',
    message: 'Your appointment was marked as no-show. Please create another booking if needed.'
  }),
  queue_next: ({ customerName, serviceName }) => ({
    title: 'Next customer ready',
    message: `${customerName || 'Next customer'} is next for ${serviceName || 'service'}.`
  })
};

function channelDefaults() {
  return [
    { channel: 'in_app', status: 'sent', sentAt: currentDate() },
    { channel: 'browser', status: 'pending' }
  ];
}

function serializeNotification(notification) {
  return {
    id: notification._id,
    appointmentId: notification.appointment,
    bookingReference: notification.bookingReference,
    customerName: notification.customerName,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    channels: notification.channels,
    metadata: notification.metadata,
    readAt: notification.readAt,
    createdAt: notification.createdAt
  };
}

export async function createAppointmentNotification({ appointment, type, metadata = {}, channels }) {
  const template = notificationTemplates[type]?.(metadata);
  if (!template) {
    const error = new Error(`Unsupported notification type: ${type}`);
    error.statusCode = 400;
    throw error;
  }

  const recipient =
    appointment.customerPhone && appointment.customerName && appointment.bookingReference
      ? appointment
      : await Appointment.findById(appointment._id || appointment.id).select('bookingReference customerName customerPhone');

  if (!recipient) {
    const error = new Error('Notification recipient appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const result = await Notification.findOneAndUpdate(
    {
      appointment: recipient._id,
      type
    },
    {
      $setOnInsert: {
        appointment: recipient._id,
        bookingReference: recipient.bookingReference,
        customerName: recipient.customerName,
        customerPhone: recipient.customerPhone,
        type,
        title: template.title,
        message: template.message,
        channels: channels || channelDefaults(),
        metadata
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      includeResultMetadata: true
    }
  );

  if (result.lastErrorObject?.updatedExisting) return null;

  return serializeNotification(result.value);
}

export async function createBookingConfirmedNotification(appointment) {
  return createAppointmentNotification({
    appointment,
    type: 'booking_confirmed'
  });
}

export async function createSkippedNotification(appointment) {
  return createAppointmentNotification({
    appointment,
    type: 'customer_skipped'
  });
}

export async function createNoShowNotification(appointment) {
  return createAppointmentNotification({
    appointment,
    type: 'no_show'
  });
}

export async function createQueueNextNotification(queueItem) {
  return createAppointmentNotification({
    appointment: {
      _id: queueItem.id,
      bookingReference: queueItem.bookingReference,
      customerName: queueItem.customerName,
      customerPhone: queueItem.customerPhone || 'unavailable'
    },
    type: 'queue_next',
    metadata: {
      customerName: queueItem.customerName,
      serviceName: queueItem.service?.name,
      queuePosition: queueItem.queuePosition,
      customersAhead: queueItem.customersAhead,
      estimatedWaitMinutes: queueItem.estimatedWaitMinutes,
      estimatedStartTime: queueItem.estimatedStartTime
    },
    channels: [{ channel: 'in_app', status: 'sent', sentAt: currentDate() }]
  });
}

export async function createQueueThresholdNotifications(liveQueue) {
  const notifications = [];

  for (const item of liveQueue.waitingQueue) {
    if (!customerQueueStatuses.includes(item.status)) continue;

    if (item.customersAhead === 2) {
      const notification = await createAppointmentNotification({
          appointment: {
            _id: item.id,
            bookingReference: item.bookingReference,
            customerName: item.customerName,
            customerPhone: item.customerPhone || 'unavailable'
          },
          type: 'two_customers_ahead',
          metadata: {
            queuePosition: item.queuePosition,
            customersAhead: item.customersAhead,
            estimatedWaitMinutes: item.estimatedWaitMinutes,
            estimatedStartTime: item.estimatedStartTime
          }
        });
      if (notification) notifications.push(notification);
    }

    if (item.customersAhead === 1 || (item.customersAhead === 0 && item.estimatedWaitMinutes > 0)) {
      const notification = await createAppointmentNotification({
          appointment: {
            _id: item.id,
            bookingReference: item.bookingReference,
            customerName: item.customerName,
            customerPhone: item.customerPhone || 'unavailable'
          },
          type: 'one_customer_ahead',
          metadata: {
            queuePosition: item.queuePosition,
            customersAhead: item.customersAhead,
            estimatedWaitMinutes: item.estimatedWaitMinutes,
            estimatedStartTime: item.estimatedStartTime
          }
        });
      if (notification) notifications.push(notification);
    }

    if (item.customersAhead === 0 && item.estimatedWaitMinutes === 0) {
      const notification = await createAppointmentNotification({
          appointment: {
            _id: item.id,
            bookingReference: item.bookingReference,
            customerName: item.customerName,
            customerPhone: item.customerPhone || 'unavailable'
          },
          type: 'turn_available',
          metadata: {
            queuePosition: item.queuePosition,
            customersAhead: item.customersAhead,
            estimatedWaitMinutes: item.estimatedWaitMinutes,
            estimatedStartTime: item.estimatedStartTime
          }
        });
      if (notification) notifications.push(notification);
    }
  }

  return notifications;
}

export async function getCustomerNotifications({ bookingReference }) {
  const notifications = await Notification.find({
    bookingReference: bookingReference.trim().toUpperCase()
  }).sort({ createdAt: -1 });

  return notifications.map(serializeNotification);
}

export async function markBrowserNotificationSent(notificationId) {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      'channels.channel': 'browser'
    },
    {
      $set: {
        'channels.$.status': 'sent',
        'channels.$.sentAt': currentDate()
      }
    },
    { new: true }
  );

  return notification ? serializeNotification(notification) : null;
}
