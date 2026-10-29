import {
  adminCheckInAppointment,
  adminCompleteServiceAppointment,
  cancelAdminAppointment,
  adminMarkLateAppointment,
  adminNoShowAppointment,
  adminSkipAppointment,
  adminStartServiceAppointment,
  createAdminAppointment,
  createCustomerAppointment,
  createWalkInAppointment,
  customerCancelAppointment,
  customerRescheduleAppointment,
  getAdminAppointment,
  listAdminAppointments,
  rescheduleAdminAppointment,
  selfCheckInAppointment,
  trackAppointment,
  updateAdminAppointment
} from '../services/appointmentService.js';
import { emitNotification, emitQueueUpdated, emitSocketEvent } from '../socket/index.js';

export async function createAppointment(req, res, next) {
  try {
    const appointment = await createCustomerAppointment(req.body);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function createAdminBooking(req, res, next) {
  try {
    const result = await createAdminAppointment(req.body);
    emitAdminQueueMutation(result);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

function emitStoredNotifications(notifications = []) {
  notifications.filter(Boolean).forEach((notification) => {
    if (notification.type === 'queue_next') {
      emitNotification(notification, 'admin');
      return;
    }

    const room = `booking:${notification.bookingReference}`;
    emitNotification(notification, room);

    if (notification.type === 'turn_available') {
      emitSocketEvent('appointment:your-turn', notification, room);
    }

    if (notification.type === 'one_customer_ahead') {
      emitSocketEvent('appointment:next', notification, room);
    }
  });
}

function emitAppointmentUpdated(result) {
  emitSocketEvent(
    'appointment:updated',
    {
      appointment: {
        bookingReference: result.appointment.bookingReference,
        status: result.appointment.status,
        service: result.appointment.service,
        staff: result.appointment.staff,
        bookingDate: result.appointment.bookingDate,
        slotTime: result.appointment.slotTime,
        estimatedStartTime: result.queueStatus.estimatedStartTime,
        queuePosition: result.queueStatus.queuePosition,
        customersAhead: result.queueStatus.customersAhead,
        estimatedWaitMinutes: result.queueStatus.estimatedWaitMinutes
      },
      queueStatus: result.queueStatus
    },
    `booking:${result.appointment.bookingReference}`
  );
}

function emitAdminAppointmentUpdated(result) {
  emitSocketEvent(
    'appointment:updated',
    {
      appointment: result.appointment,
      queueStatus: result.queueStatus
    },
    'admin'
  );
  emitAppointmentUpdated(result);
}

export async function trackCustomerAppointment(req, res, next) {
  try {
    const tracking = await trackAppointment(req.body);

    res.status(200).json({
      success: true,
      tracking
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function cancelCustomerAppointment(req, res, next) {
  try {
    const result = await customerCancelAppointment(req.params.id, req.body);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function rescheduleCustomerAppointment(req, res, next) {
  try {
    const result = await customerRescheduleAppointment(req.params.id, req.body);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function createWalkIn(req, res, next) {
  try {
    const result = await createWalkInAppointment(req.body);
    emitAdminQueueMutation(result);

    res.status(201).json({
      success: true,
      message: 'Walk-in added to queue successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function listAppointments(req, res, next) {
  try {
    const result = await listAdminAppointments(req.query);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function getAppointment(req, res, next) {
  try {
    const appointment = await getAdminAppointment(req.params.id);

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function updateAppointment(req, res, next) {
  try {
    const result = await updateAdminAppointment(req.params.id, req.body);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function rescheduleAppointment(req, res, next) {
  try {
    const result = await rescheduleAdminAppointment(req.params.id, req.body);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function cancelAppointment(req, res, next) {
  try {
    const result = await cancelAdminAppointment(req.params.id);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function checkInAppointment(req, res, next) {
  try {
    const result = await adminCheckInAppointment(req.params.id);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Customer checked in successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function startAppointment(req, res, next) {
  try {
    const result = await adminStartServiceAppointment(req.params.id, req.body);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Service started successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function completeAppointment(req, res, next) {
  try {
    const result = await adminCompleteServiceAppointment(req.params.id);

    emitQueueUpdated(result.queue);
    emitAdminAppointmentUpdated(result);
    emitSocketEvent('staff:availability', { queue: result.queue, emittedAt: new Date() }, 'admin');

    if (result.nextCustomer) {
      emitStoredNotifications(result.notifications);
    }

    res.status(200).json({
      success: true,
      message: 'Service completed successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

function emitAdminQueueMutation(result) {
  emitQueueUpdated(result.queue);
  emitAdminAppointmentUpdated(result);
  emitSocketEvent('staff:availability', { queue: result.queue, emittedAt: new Date() }, 'admin');
  emitStoredNotifications(result.notifications);
}

export async function markLateAppointment(req, res, next) {
  try {
    const result = await adminMarkLateAppointment(req.params.id);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Customer marked late',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function skipAppointment(req, res, next) {
  try {
    const result = await adminSkipAppointment(req.params.id);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Customer skipped and moved behind arrived customers',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function noShowAppointment(req, res, next) {
  try {
    const result = await adminNoShowAppointment(req.params.id);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'Customer marked no-show',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}

export async function selfCheckIn(req, res, next) {
  try {
    const result = await selfCheckInAppointment(req.body);
    emitAdminQueueMutation(result);

    res.status(200).json({
      success: true,
      message: 'You are checked in',
      ...result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}
