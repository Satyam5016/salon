import Appointment from '../models/Appointment.js';
import SalonSettings from '../models/SalonSettings.js';
import Staff from '../models/Staff.js';
import { now as currentDate } from '../utils/clock.js';

const activeQueueStatuses = ['booked', 'confirmed', 'notified', 'arrived', 'waiting', 'in_service', 'late', 'skipped'];
const currentServiceStatuses = ['in_service'];
const waitingStatuses = ['booked', 'confirmed', 'notified', 'arrived', 'waiting', 'late', 'skipped'];
const inactiveQueueStatuses = ['completed', 'cancelled', 'no_show'];

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = startOfDay(date);
  value.setDate(value.getDate() + 1);
  return value;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function minDate(dates) {
  return dates.reduce((earliest, date) => (date < earliest ? date : earliest), dates[0]);
}

function slotDateTime(appointment) {
  const datePart = appointment.bookingDate.toISOString().split('T')[0];
  return new Date(`${datePart}T${appointment.slotTime}:00`);
}

function operationalTime(appointment) {
  if (appointment.arrivalTime) return appointment.arrivalTime;
  if (appointment.estimatedStartTime) return appointment.estimatedStartTime;
  return slotDateTime(appointment);
}

function priorityWeight(appointment) {
  if (appointment.status === 'arrived' || appointment.status === 'waiting') return 0;
  if (appointment.status === 'skipped') return 1;
  if (appointment.status === 'late') return 2;
  if (appointment.status === 'notified' || appointment.status === 'confirmed') return 2;
  return 3;
}

function sortQueueAppointments(a, b) {
  const statusDelta = priorityWeight(a) - priorityWeight(b);
  if (statusDelta !== 0) return statusDelta;

  const positionA = a.queuePosition || Number.MAX_SAFE_INTEGER;
  const positionB = b.queuePosition || Number.MAX_SAFE_INTEGER;
  if (positionA !== positionB) return positionA - positionB;

  const timeDelta = operationalTime(a).getTime() - operationalTime(b).getTime();
  if (timeDelta !== 0) return timeDelta;

  return a.createdAt.getTime() - b.createdAt.getTime();
}

function serializeQueueAppointment(appointment, queueMeta = {}) {
  return {
    id: appointment._id,
    bookingReference: appointment.bookingReference,
    customerName: appointment.customerName,
    service: appointment.service
      ? {
          id: appointment.service._id,
          name: appointment.service.name,
          durationMinutes: appointment.service.durationMinutes
        }
      : null,
    staff: appointment.staff
      ? {
          id: appointment.staff._id,
          name: appointment.staff.name,
          specialization: appointment.staff.specialization
        }
      : null,
    preferredStaff: appointment.preferredStaff
      ? {
          id: appointment.preferredStaff._id,
          name: appointment.preferredStaff.name
        }
      : null,
    bookingDate: appointment.bookingDate,
    slotTime: appointment.slotTime,
    source: appointment.source,
    status: appointment.status,
    arrivalTime: appointment.arrivalTime,
    serviceStartTime: appointment.serviceStartTime,
    serviceEndTime: appointment.serviceEndTime,
    estimatedDuration: appointment.estimatedDuration,
    expectedRemainingMinutes: queueMeta.expectedRemainingMinutes,
    assignedStaffId: queueMeta.assignedStaffId,
    queuePosition: queueMeta.queuePosition ?? appointment.queuePosition,
    customersAhead: queueMeta.customersAhead ?? 0,
    estimatedWaitMinutes: queueMeta.estimatedWaitMinutes ?? 0,
    estimatedStartTime: queueMeta.estimatedStartTime ?? appointment.estimatedStartTime
  };
}

async function getQueueAppointments(date = currentDate()) {
  return Appointment.find({
    bookingDate: {
      $gte: startOfDay(date),
      $lt: endOfDay(date)
    },
    status: { $in: activeQueueStatuses, $nin: inactiveQueueStatuses }
  })
    .populate('service', 'name durationMinutes category')
    .populate('staff', 'name specialization active services')
    .populate('preferredStaff', 'name specialization active services')
    .sort({ slotTime: 1, arrivalTime: 1, createdAt: 1 });
}

function expectedRemainingMinutes(appointment, now) {
  const start = appointment.serviceStartTime || appointment.estimatedStartTime || now;
  const elapsed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / 60000));
  return Math.max(0, appointment.estimatedDuration - elapsed);
}

function currentServicesFrom(appointments, now = currentDate()) {
  return appointments
    .filter((appointment) => currentServiceStatuses.includes(appointment.status))
    .sort((a, b) => {
      const startA = a.serviceStartTime || a.estimatedStartTime || a.createdAt;
      const startB = b.serviceStartTime || b.estimatedStartTime || b.createdAt;
      return startA.getTime() - startB.getTime();
    })
    .map((appointment) =>
      serializeQueueAppointment(appointment, {
        expectedRemainingMinutes: expectedRemainingMinutes(appointment, now),
        assignedStaffId: appointment.staff?._id
      })
    );
}

async function getEstimatorContext(appointments, now) {
  const settings = await SalonSettings.findOne();
  const activeStaff = await Staff.find({ active: true }).select('name services workingDays workingHours active');
  const numberOfChairs = settings?.numberOfChairs || 1;
  const staffAvailableAt = new Map(activeStaff.map((member) => [member._id.toString(), now]));
  const chairAvailableAt = [];

  appointments
    .filter((appointment) => currentServiceStatuses.includes(appointment.status))
    .forEach((appointment) => {
      const remainingMinutes = expectedRemainingMinutes(appointment, now);
      const availableAt = addMinutes(now, remainingMinutes);
      const staffId = appointment.staff?._id?.toString();

      if (staffId) staffAvailableAt.set(staffId, availableAt);
      chairAvailableAt.push(availableAt);
    });

  while (chairAvailableAt.length < numberOfChairs) {
    chairAvailableAt.push(now);
  }

  return {
    activeStaff,
    staffAvailableAt,
    chairAvailableAt: chairAvailableAt.slice(0, numberOfChairs)
  };
}

function staffCanPerformQueueItem(member, appointment) {
  const serviceId = appointment.service?._id?.toString();
  return serviceId && member.services.some((service) => service.toString() === serviceId);
}

function eligibleStaffForQueueItem(appointment, activeStaff) {
  const assignedStaffId = appointment.staff?._id?.toString();
  const preferredStaffId = appointment.preferredStaff?._id?.toString();
  const requestedStaffId = assignedStaffId || preferredStaffId;

  if (requestedStaffId) {
    return activeStaff.filter((member) => member._id.toString() === requestedStaffId && staffCanPerformQueueItem(member, appointment));
  }

  return activeStaff.filter((member) => staffCanPerformQueueItem(member, appointment));
}

function selectEarliestAssignment({ appointment, activeStaff, staffAvailableAt, chairAvailableAt, now }) {
  const eligibleStaff = eligibleStaffForQueueItem(appointment, activeStaff);

  if (eligibleStaff.length === 0) {
    return {
      estimatedStartTime: appointment.estimatedStartTime || now,
      assignedStaffId: null
    };
  }

  const earliestChair = minDate(chairAvailableAt);
  const candidates = eligibleStaff
    .map((member) => {
      const staffReady = staffAvailableAt.get(member._id.toString()) || now;
      const appointmentReady = appointment.estimatedStartTime || now;
      const estimatedStartTime = new Date(Math.max(now.getTime(), appointmentReady.getTime(), staffReady.getTime(), earliestChair.getTime()));

      return {
        member,
        estimatedStartTime
      };
    })
    .sort((a, b) => a.estimatedStartTime.getTime() - b.estimatedStartTime.getTime() || a.member.name.localeCompare(b.member.name));

  const selected = candidates[0];
  const finishTime = addMinutes(selected.estimatedStartTime, appointment.estimatedDuration);
  const selectedStaffId = selected.member._id.toString();
  const chairIndex = chairAvailableAt.findIndex((date) => date.getTime() === earliestChair.getTime());

  staffAvailableAt.set(selectedStaffId, finishTime);
  chairAvailableAt[chairIndex] = finishTime;

  return {
    estimatedStartTime: selected.estimatedStartTime,
    assignedStaffId: selectedStaffId
  };
}

async function waitingQueueFrom(appointments, now = currentDate()) {
  const context = await getEstimatorContext(appointments, now);

  return appointments
    .filter((appointment) => waitingStatuses.includes(appointment.status))
    .sort(sortQueueAppointments)
    .map((appointment, index) => {
      const { estimatedStartTime, assignedStaffId } = selectEarliestAssignment({
        appointment,
        activeStaff: context.activeStaff,
        staffAvailableAt: context.staffAvailableAt,
        chairAvailableAt: context.chairAvailableAt,
        now
      });
      const estimatedWaitMinutes = Math.max(0, Math.ceil((estimatedStartTime.getTime() - now.getTime()) / 60000));
      const item = serializeQueueAppointment(appointment, {
        queuePosition: index + 1,
        customersAhead: index,
        estimatedWaitMinutes,
        estimatedStartTime,
        assignedStaffId
      });
      return item;
    });
}

export async function getLiveQueue(date = currentDate()) {
  const appointments = await getQueueAppointments(date);
  const now = currentDate();
  const currentServices = currentServicesFrom(appointments, now);
  const waitingQueue = await waitingQueueFrom(appointments, now);

  return {
    date: startOfDay(date),
    currentServices,
    waitingQueue,
    totals: {
      active: appointments.length,
      currentServices: currentServices.length,
      waiting: waitingQueue.length
    }
  };
}

export async function getAppointmentQueueStatus(appointmentId) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('service', 'name durationMinutes category')
    .populate('staff', 'name specialization')
    .populate('preferredStaff', 'name specialization');

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (inactiveQueueStatuses.includes(appointment.status)) {
    return {
      id: appointment._id,
      bookingReference: appointment.bookingReference,
      status: appointment.status,
      queuePosition: null,
      customersAhead: 0,
      estimatedWaitMinutes: 0,
      estimatedStartTime: appointment.estimatedStartTime
    };
  }

  const liveQueue = await getLiveQueue(appointment.bookingDate);
  const waitingItem = liveQueue.waitingQueue.find((item) => item.id.toString() === appointment._id.toString());
  const currentItem = liveQueue.currentServices.find((item) => item.id.toString() === appointment._id.toString());

  if (waitingItem) return waitingItem;
  if (currentItem) return { ...currentItem, customersAhead: 0, estimatedWaitMinutes: 0 };

  return serializeQueueAppointment(appointment);
}
