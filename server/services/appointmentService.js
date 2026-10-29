import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';
import SalonSettings from '../models/SalonSettings.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import { now as currentDate } from '../utils/clock.js';
import { getAvailability } from './availabilityService.js';
import {
  createBookingConfirmedNotification,
  createNoShowNotification,
  createQueueNextNotification,
  createQueueThresholdNotifications,
  createSkippedNotification,
  getCustomerNotifications
} from './notificationService.js';
import { getAppointmentQueueStatus, getLiveQueue } from './queueService.js';

const queueBlockingStatuses = ['booked', 'confirmed', 'notified', 'arrived', 'waiting', 'in_service', 'late'];
const checkInAllowedStatuses = ['booked', 'confirmed', 'notified', 'late', 'skipped'];
const startServiceAllowedStatuses = ['arrived', 'waiting'];
const completeServiceAllowedStatuses = ['in_service'];
const missingCustomerStatuses = ['booked', 'confirmed', 'notified', 'late', 'skipped'];
const editableStatuses = ['booked', 'confirmed', 'notified', 'arrived', 'waiting', 'late', 'skipped'];
const customerMutableStatuses = ['booked', 'confirmed', 'notified'];

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidPhone(phone) {
  return /^[+]?[\d\s()-]{7,20}$/.test(phone);
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isPastDate(date) {
  return startOfDay(date).getTime() < startOfDay(currentDate()).getTime();
}

function buildEstimatedStartTime(date, slotTime) {
  return new Date(`${date}T${slotTime}:00`);
}

function timeFromDate(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

function assertObjectId(value, label) {
  if (value && value !== 'any' && !mongoose.Types.ObjectId.isValid(value.toString())) {
    throw createError(`Invalid ${label}`, 400);
  }
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function parseAdminDateRange(filter) {
  const now = currentDate();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (filter === 'today' || filter === 'walk-ins') {
    return { $gte: todayStart, $lt: tomorrowStart };
  }

  if (filter === 'upcoming' || filter === 'online') {
    return { $gte: todayStart };
  }

  return null;
}

function adminAppointmentQuery({ filter = 'today', search = '' } = {}) {
  const query = {};
  const dateRange = parseAdminDateRange(filter);

  if (dateRange) query.bookingDate = dateRange;

  if (filter === 'completed') query.status = 'completed';
  if (filter === 'cancelled') query.status = 'cancelled';
  if (filter === 'no-show') query.status = 'no_show';
  if (filter === 'walk-ins') query.source = 'walk-in';
  if (filter === 'online') query.source = 'online';

  const cleanSearch = search.trim();
  if (cleanSearch) {
    const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [{ customerName: searchRegex }, { customerPhone: searchRegex }, { bookingReference: searchRegex }];
  }

  return query;
}

function populatedAppointmentQuery(query) {
  return query
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo services active')
    .populate('preferredStaff', 'name specialization photo services active');
}

function generateReference() {
  const year = currentDate().getFullYear();
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BLISS-${year}-${code}`;
}

async function generateUniqueReference() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bookingReference = generateReference();
    const exists = await Appointment.exists({ bookingReference });
    if (!exists) return bookingReference;
  }

  throw createError('Unable to generate booking reference', 500);
}

async function getNextQueuePosition(bookingDate) {
  const start = startOfDay(bookingDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const lastQueued = await Appointment.findOne({
    bookingDate: {
      $gte: start,
      $lt: end
    },
    status: { $in: queueBlockingStatuses },
    queuePosition: { $ne: null }
  })
    .sort({ queuePosition: -1 })
    .select('queuePosition');

  return (lastQueued?.queuePosition || 0) + 1;
}

async function getNextPhysicalQueuePosition(bookingDate) {
  const start = startOfDay(bookingDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const lastPhysicallyWaiting = await Appointment.findOne({
    bookingDate: {
      $gte: start,
      $lt: end
    },
    status: { $in: ['arrived', 'waiting'] },
    queuePosition: { $ne: null }
  })
    .sort({ queuePosition: -1 })
    .select('queuePosition');

  return (lastPhysicallyWaiting?.queuePosition || 0) + 1;
}

function serializeAppointment(appointment) {
  return {
    id: appointment._id,
    bookingReference: appointment.bookingReference,
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone,
    customerEmail: appointment.customerEmail,
    service: appointment.service,
    staff: appointment.staff,
    preferredStaff: appointment.preferredStaff,
    bookingDate: appointment.bookingDate,
    slotTime: appointment.slotTime,
    estimatedStartTime: appointment.estimatedStartTime,
    estimatedDuration: appointment.estimatedDuration,
    status: appointment.status,
    queuePosition: appointment.queuePosition,
    arrivalTime: appointment.arrivalTime,
    serviceStartTime: appointment.serviceStartTime,
    serviceEndTime: appointment.serviceEndTime,
    source: appointment.source,
    notes: appointment.notes,
    notificationStatus: appointment.notificationStatus,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function getCustomersAhead(appointment) {
  const queueStatus = await getAppointmentQueueStatus(appointment._id);
  return queueStatus.customersAhead || 0;
}

async function applyCheckIn(appointment) {
  if (appointment.status === 'arrived') {
    return serializeAdminQueueMutation(appointment);
  }

  if (!checkInAllowedStatuses.includes(appointment.status)) {
    throw createError(`Appointment cannot be checked in from ${appointment.status} status`);
  }

  const wasSkipped = appointment.status === 'skipped';
  const update = {
    status: 'arrived',
    arrivalTime: currentDate()
  };
  if (wasSkipped) update.queuePosition = await getNextPhysicalQueuePosition(appointment.bookingDate);

  const checkedInAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $in: checkInAllowedStatuses },
      arrivalTime: null
    },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!checkedInAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'arrived') return serializeAdminQueueMutation(current);
    throw createError('Appointment check-in could not be applied', 409);
  }

  const populatedAppointment = await Appointment.findById(checkedInAppointment._id)
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo')
    .populate('preferredStaff', 'name specialization photo');
  const queueStatus = await getAppointmentQueueStatus(checkedInAppointment._id);
  const queue = await getLiveQueue(checkedInAppointment.bookingDate);
  const notifications = await createQueueThresholdNotifications(queue);

  return {
    appointment: serializeAppointment(populatedAppointment),
    queueStatus,
    queue,
    notifications
  };
}

async function getGracePeriodMinutes() {
  const settings = await SalonSettings.findOne();
  return settings?.gracePeriodMinutes ?? 10;
}

function getExpectedTurnForMissingCustomer(appointment) {
  return new Date(appointment.estimatedStartTime);
}

async function assertGracePeriodExceeded(appointment) {
  const gracePeriodMinutes = await getGracePeriodMinutes();
  const expectedTurn = await getExpectedTurnForMissingCustomer(appointment);
  const deadline = addMinutes(expectedTurn, gracePeriodMinutes);

  if (Number.isNaN(deadline.getTime())) {
    throw createError('Appointment does not have a valid expected turn time');
  }

  if (currentDate() < deadline) {
    throw createError(`Grace period has not passed yet. Try after ${deadline.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`);
  }
}

async function serializeAdminQueueMutation(appointment) {
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo')
    .populate('preferredStaff', 'name specialization photo');
  const queueStatus = await getAppointmentQueueStatus(appointment._id);
  const queue = await getLiveQueue(appointment.bookingDate);
  const notifications = await createQueueThresholdNotifications(queue);

  return {
    appointment: serializeAppointment(populatedAppointment),
    queueStatus,
    queue,
    notifications
  };
}

async function validateAppointmentServiceAndStaff({ appointmentId, serviceId, staffId, bookingDate, slotTime }) {
  assertObjectId(serviceId, 'service');
  assertObjectId(staffId, 'staff');

  const service = await Service.findOne({ _id: serviceId, active: true }).populate('availableStaff');
  if (!service) throw createError('Service not found or inactive', 404);

  let requestedStaff = null;
  const cleanStaffId = staffId && staffId !== 'any' ? staffId : null;

  if (cleanStaffId) {
    requestedStaff = await Staff.findOne({ _id: cleanStaffId, active: true });
    if (!requestedStaff) throw createError('Selected stylist is not active or does not exist', 404);

    const canPerform = requestedStaff.services.some((id) => id.toString() === service._id.toString());
    if (!canPerform) throw createError('Selected stylist cannot perform this service');
  }

  if (bookingDate && slotTime) {
    const availability = await getAvailability({
      serviceId: service._id.toString(),
      staffId: cleanStaffId || 'any',
      date: bookingDate,
      excludeAppointmentId: appointmentId
    });
    const selectedSlot = availability.slots.find((slot) => slot.time === slotTime);
    if (!selectedSlot) throw createError('Selected slot is no longer available', 409);
    return {
      service,
      staffId: requestedStaff?._id || selectedSlot.availableStaff[0]?.id || null,
      preferredStaffId: requestedStaff?._id || null
    };
  }

  return {
    service,
    staffId: requestedStaff?._id || null,
    preferredStaffId: requestedStaff?._id || null
  };
}

export async function listAdminAppointments({ filter = 'today', search = '', page = 1, limit = 30 } = {}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 30));
  const query = adminAppointmentQuery({ filter, search });
  const skip = (currentPage - 1) * pageSize;

  const [appointments, total] = await Promise.all([
    populatedAppointmentQuery(Appointment.find(query))
      .sort({ bookingDate: -1, slotTime: 1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Appointment.countDocuments(query)
  ]);

  return {
    appointments: appointments.map(serializeAppointment),
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      pages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

export async function getAdminAppointment(appointmentId) {
  const appointment = await populatedAppointmentQuery(Appointment.findById(appointmentId));
  if (!appointment) throw createError('Appointment not found', 404);

  return serializeAppointment(appointment);
}

export async function updateAdminAppointment(appointmentId, payload) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);
  if (!editableStatuses.includes(appointment.status)) {
    throw createError(`Appointment cannot be edited from ${appointment.status} status`);
  }

  if (payload.customerName !== undefined) {
    if (!payload.customerName.trim()) throw createError('Customer name is required');
    appointment.customerName = payload.customerName.trim();
  }

  if (payload.customerPhone !== undefined) {
    if (!isValidPhone(payload.customerPhone.trim())) throw createError('Please provide a valid phone number');
    appointment.customerPhone = payload.customerPhone.trim();
  }

  if (payload.customerEmail !== undefined) {
    appointment.customerEmail = payload.customerEmail?.trim() || undefined;
  }

  const serviceId = payload.serviceId || appointment.service;
  const staffId = payload.staffId !== undefined ? payload.staffId : appointment.preferredStaff || appointment.staff || 'any';

  if (payload.serviceId !== undefined || payload.staffId !== undefined) {
    const validation = await validateAppointmentServiceAndStaff({ serviceId, staffId });
    appointment.service = validation.service._id;
    appointment.staff = validation.staffId;
    appointment.preferredStaff = validation.preferredStaffId;
    appointment.estimatedDuration = validation.service.durationMinutes;
  }

  if (payload.notes !== undefined) appointment.notes = payload.notes?.trim() || '';

  try {
    await appointment.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) throw createError('Selected slot is no longer available', 409);
    throw error;
  }

  return serializeAdminQueueMutation(appointment);
}

export async function rescheduleAdminAppointment(appointmentId, payload) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);
  if (!editableStatuses.includes(appointment.status)) {
    throw createError(`Appointment cannot be rescheduled from ${appointment.status} status`);
  }

  const rawBookingDate = payload.bookingDate;
  const slotTime = payload.slotTime;
  if (!rawBookingDate) throw createError('Booking date is required');
  if (!slotTime) throw createError('Slot time is required');

  const bookingDate = new Date(`${rawBookingDate}T00:00:00`);
  if (Number.isNaN(bookingDate.getTime())) throw createError('A valid booking date is required');
  if (isPastDate(bookingDate)) throw createError('Booking date cannot be in the past');

  const serviceId = payload.serviceId || appointment.service;
  const staffId = payload.staffId !== undefined ? payload.staffId : appointment.preferredStaff || appointment.staff || 'any';
  const validation = await validateAppointmentServiceAndStaff({
    appointmentId,
    serviceId,
    staffId,
    bookingDate: rawBookingDate,
    slotTime
  });

  appointment.service = validation.service._id;
  appointment.staff = validation.staffId;
  appointment.preferredStaff = validation.preferredStaffId;
  appointment.bookingDate = bookingDate;
  appointment.slotTime = slotTime;
  appointment.estimatedStartTime = buildEstimatedStartTime(rawBookingDate, slotTime);
  appointment.estimatedDuration = validation.service.durationMinutes;
  appointment.queuePosition = null;
  if (['late', 'skipped'].includes(appointment.status)) appointment.status = 'booked';
  try {
    await appointment.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) throw createError('Selected slot is no longer available', 409);
    throw error;
  }

  return serializeAdminQueueMutation(appointment);
}

export async function cancelAdminAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);
  if (appointment.status === 'cancelled') return serializeAdminQueueMutation(appointment);
  if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
    throw createError(`Appointment cannot be cancelled from ${appointment.status} status`);
  }

  const cancelledAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $nin: ['completed', 'cancelled', 'no_show'] }
    },
    {
      $set: { status: 'cancelled' },
      $unset: { queuePosition: '' }
    },
    { new: true, runValidators: true }
  );

  if (!cancelledAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'cancelled') return serializeAdminQueueMutation(current);
    throw createError('Appointment could not be cancelled', 409);
  }

  return serializeAdminQueueMutation(cancelledAppointment);
}

async function getAvailableServiceStaff({ appointment, staffId }) {
  assertObjectId(staffId, 'staff');
  const serviceId = appointment.service._id || appointment.service;
  const selectedStaffId = staffId || appointment.staff?._id || appointment.staff || appointment.preferredStaff?._id || appointment.preferredStaff;
  const busyStaff = await Appointment.find({
    _id: { $ne: appointment._id },
    status: 'in_service',
    staff: { $ne: null }
  }).select('staff');
  const busyStaffIds = new Set(busyStaff.map((item) => item.staff.toString()));

  if (selectedStaffId) {
    const staff = await Staff.findOne({ _id: selectedStaffId, active: true });
    if (!staff) throw createError('Selected stylist is not active or does not exist', 404);

    const canPerform = staff.services.some((id) => id.toString() === serviceId.toString());
    if (!canPerform) throw createError('Selected stylist cannot perform this service');
    if (busyStaffIds.has(staff._id.toString())) throw createError('Selected stylist is already servicing another customer', 409);

    return staff;
  }

  const staff = await Staff.findOne({
    active: true,
    services: serviceId,
    _id: { $nin: [...busyStaffIds] }
  }).sort({ name: 1 });

  if (!staff) throw createError('No eligible stylist is currently available', 409);
  return staff;
}

function isEligibleForFreedStaff(queueItem, staff) {
  const staffServiceIds = new Set((staff.services || []).map((id) => id.toString()));
  const serviceId = queueItem.service?.id?.toString();
  if (!serviceId || !staffServiceIds.has(serviceId)) return false;

  const assignedStaffId = queueItem.staff?.id?.toString();
  if (assignedStaffId) return assignedStaffId === staff._id.toString();

  const preferredStaffId = queueItem.preferredStaff?.id?.toString();
  if (preferredStaffId) return preferredStaffId === staff._id.toString();

  return true;
}

async function notifyNextEligibleCustomer(liveQueue, staff) {
  if (!staff) return { liveQueue, nextCustomer: null };

  const nextCustomer = liveQueue.waitingQueue.find((item) => isEligibleForFreedStaff(item, staff));
  if (!nextCustomer) return { liveQueue, nextCustomer: null };

  const appointment = await Appointment.findById(nextCustomer.id);
  if (!appointment) return { liveQueue, nextCustomer: null };

  if (['booked', 'confirmed'].includes(appointment.status)) {
    appointment.status = 'notified';
  }

  appointment.notificationStatus.inApp = 'sent';
  appointment.notificationStatus.browser = 'pending';
  await appointment.save();

  const recalculatedQueue = await getLiveQueue(appointment.bookingDate);
  const recalculatedNextCustomer =
    recalculatedQueue.waitingQueue.find((item) => item.id.toString() === appointment._id.toString()) || nextCustomer;
  const queueNextNotification = await createQueueNextNotification(recalculatedNextCustomer);
  const thresholdNotifications = await createQueueThresholdNotifications(recalculatedQueue);

  return {
    liveQueue: recalculatedQueue,
    nextCustomer: recalculatedNextCustomer,
    notifications: [queueNextNotification, ...thresholdNotifications].filter(Boolean)
  };
}

function isWithinCheckInWindow({ now, expectedTurn, windowMinutes }) {
  const windowMs = windowMinutes * 60 * 1000;
  const delta = Math.abs(now.getTime() - expectedTurn.getTime());
  return delta <= windowMs;
}

async function assertCustomerCanChangeAppointment(appointment) {
  if (!customerMutableStatuses.includes(appointment.status)) {
    throw createError(`This appointment cannot be changed from ${appointment.status} status`, 409);
  }

  const settings = await SalonSettings.findOne();
  const cutoffMinutes = settings?.cancellationCutoffMinutes ?? 60;
  const cutoffTime = addMinutes(currentDate(), cutoffMinutes);
  const expectedStart = new Date(appointment.estimatedStartTime);

  if (Number.isNaN(expectedStart.getTime())) {
    throw createError('Appointment does not have a valid scheduled time');
  }

  if (expectedStart < cutoffTime) {
    throw createError(`Changes are closed within ${cutoffMinutes} minutes of your appointment`, 403);
  }
}

async function findCustomerOwnedAppointment({ appointmentId, phone }) {
  if (!phone?.trim()) throw createError('Phone number is required');
  if (!isValidPhone(phone.trim())) throw createError('Please provide a valid phone number');

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment || normalizePhone(appointment.customerPhone) !== normalizePhone(phone)) {
    throw createError('No booking found for the provided details', 404);
  }

  return appointment;
}

export async function trackAppointment({ bookingReference, phone }) {
  if (!bookingReference?.trim()) throw createError('Booking ID is required');
  if (!phone?.trim()) throw createError('Phone number is required');
  if (!isValidPhone(phone.trim())) throw createError('Please provide a valid phone number');

  const appointment = await Appointment.findOne({
    bookingReference: bookingReference.trim().toUpperCase()
  })
    .populate('service', 'name category price durationMinutes')
    .populate('staff', 'name specialization photo');

  if (!appointment || normalizePhone(appointment.customerPhone) !== normalizePhone(phone)) {
    throw createError('No booking found for the provided details', 404);
  }

  const queueStatus = await getAppointmentQueueStatus(appointment._id);
  const notifications = await getCustomerNotifications({
    bookingReference: appointment.bookingReference
  });
  const settings = await SalonSettings.findOne();
  const cancellationCutoffMinutes = settings?.cancellationCutoffMinutes ?? 60;
  const expectedStart = new Date(appointment.estimatedStartTime);
  const canCustomerChange =
    customerMutableStatuses.includes(appointment.status) &&
    !Number.isNaN(expectedStart.getTime()) &&
    expectedStart >= addMinutes(currentDate(), cancellationCutoffMinutes);

  return {
    appointmentId: appointment._id,
    bookingReference: appointment.bookingReference,
    status: appointment.status,
    service: {
      id: appointment.service._id,
      name: appointment.service.name,
      category: appointment.service.category,
      durationMinutes: appointment.service.durationMinutes,
      price: appointment.service.price
    },
    stylist: appointment.staff
      ? {
          id: appointment.staff._id,
          name: appointment.staff.name,
          specialization: appointment.staff.specialization
        }
      : null,
    bookingDate: appointment.bookingDate,
    bookedTime: appointment.slotTime,
    liveEstimatedStart: queueStatus.estimatedStartTime,
    queuePosition: queueStatus.queuePosition,
    customersAhead: queueStatus.customersAhead,
    estimatedWaitingMinutes: queueStatus.estimatedWaitMinutes,
    notifications,
    canCancel: canCustomerChange,
    canReschedule: canCustomerChange,
    canSelfCheckIn: isWithinCheckInWindow({
      now: currentDate(),
      expectedTurn: new Date(queueStatus.estimatedStartTime),
      windowMinutes: settings?.selfCheckInWindowMinutes || 30
    })
  };
}

export async function customerCancelAppointment(appointmentId, { phone }) {
  const appointment = await findCustomerOwnedAppointment({ appointmentId, phone });
  await assertCustomerCanChangeAppointment(appointment);

  const cancelledAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $in: customerMutableStatuses }
    },
    {
      $set: { status: 'cancelled' },
      $unset: { queuePosition: '' }
    },
    { new: true, runValidators: true }
  );

  if (!cancelledAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'cancelled') return serializeAdminQueueMutation(current);
    throw createError('Appointment could not be cancelled', 409);
  }

  return serializeAdminQueueMutation(cancelledAppointment);
}

export async function customerRescheduleAppointment(appointmentId, payload) {
  const appointment = await findCustomerOwnedAppointment({ appointmentId, phone: payload.phone });
  await assertCustomerCanChangeAppointment(appointment);

  return rescheduleAdminAppointment(appointmentId, payload);
}

export async function adminCheckInAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);

  return applyCheckIn(appointment);
}

export async function adminStartServiceAppointment(appointmentId, { staffId } = {}) {
  const appointment = await Appointment.findById(appointmentId).populate('service', 'name durationMinutes');
  if (!appointment) throw createError('Appointment not found', 404);
  if (appointment.status === 'in_service') return serializeAdminQueueMutation(appointment);

  if (!startServiceAllowedStatuses.includes(appointment.status)) {
    throw createError('Customer must be checked in before starting service');
  }

  const staff = await getAvailableServiceStaff({ appointment, staffId });

  let startedAppointment;
  try {
    startedAppointment = await Appointment.findOneAndUpdate(
      {
        _id: appointment._id,
        status: { $in: startServiceAllowedStatuses }
      },
      {
        $set: {
          status: 'in_service',
          serviceStartTime: currentDate(),
          staff: staff._id
        }
      },
      { new: true, runValidators: true }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) throw createError('Selected stylist is already servicing another customer', 409);
    throw error;
  }

  if (!startedAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'in_service') return serializeAdminQueueMutation(current);
    throw createError('Service could not be started because the appointment changed', 409);
  }

  const populatedAppointment = await Appointment.findById(startedAppointment._id)
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo')
    .populate('preferredStaff', 'name specialization photo');
  const queueStatus = await getAppointmentQueueStatus(startedAppointment._id);
  const queue = await getLiveQueue(startedAppointment.bookingDate);
  const notifications = await createQueueThresholdNotifications(queue);

  return {
    appointment: serializeAppointment(populatedAppointment),
    queueStatus,
    queue,
    notifications
  };
}

export async function adminCompleteServiceAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo active services')
    .populate('preferredStaff', 'name specialization photo');

  if (!appointment) throw createError('Appointment not found', 404);
  if (appointment.status === 'completed') {
    const queueStatus = await getAppointmentQueueStatus(appointment._id);
    const queue = await getLiveQueue(appointment.bookingDate);
    return {
      appointment: serializeAppointment(appointment),
      queueStatus,
      queue,
      nextCustomer: null,
      notifications: []
    };
  }

  if (!completeServiceAllowedStatuses.includes(appointment.status)) {
    throw createError('Only an in-service appointment can be completed');
  }

  const freedStaff = appointment.staff;
  const completedAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $in: completeServiceAllowedStatuses }
    },
    {
      $set: {
        status: 'completed',
        serviceEndTime: currentDate()
      }
    },
    { new: true, runValidators: true }
  );

  if (!completedAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'completed') {
      const queueStatus = await getAppointmentQueueStatus(current._id);
      const queue = await getLiveQueue(current.bookingDate);
      return {
        appointment: serializeAppointment(current),
        queueStatus,
        queue,
        nextCustomer: null,
        notifications: []
      };
    }
    throw createError('Service could not be completed because the appointment changed', 409);
  }

  const populatedAppointment = await Appointment.findById(completedAppointment._id)
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo')
    .populate('preferredStaff', 'name specialization photo');
  const queueStatus = await getAppointmentQueueStatus(completedAppointment._id);
  const liveQueue = await getLiveQueue(completedAppointment.bookingDate);
  const notificationResult = await notifyNextEligibleCustomer(liveQueue, freedStaff);

  return {
    appointment: serializeAppointment(populatedAppointment),
    queueStatus,
    queue: notificationResult.liveQueue,
    nextCustomer: notificationResult.nextCustomer,
    notifications: notificationResult.notifications || []
  };
}

export async function adminMarkLateAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);
  if (appointment.status === 'late') return serializeAdminQueueMutation(appointment);

  if (!['booked', 'confirmed', 'notified'].includes(appointment.status)) {
    throw createError(`Appointment cannot be marked late from ${appointment.status} status`);
  }

  await assertGracePeriodExceeded(appointment);

  const lateAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $in: ['booked', 'confirmed', 'notified'] },
      arrivalTime: null
    },
    { $set: { status: 'late' } },
    { new: true, runValidators: true }
  );

  if (!lateAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'late') return serializeAdminQueueMutation(current);
    throw createError('Appointment could not be marked late', 409);
  }

  return serializeAdminQueueMutation(lateAppointment);
}

export async function adminSkipAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);
  if (appointment.status === 'skipped') return serializeAdminQueueMutation(appointment);

  if (!missingCustomerStatuses.includes(appointment.status) || appointment.arrivalTime) {
    throw createError('Only a missing customer can be skipped');
  }

  const queuePosition = await getNextPhysicalQueuePosition(appointment.bookingDate);
  const skippedAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $in: missingCustomerStatuses },
      arrivalTime: null
    },
    {
      $set: {
        status: 'skipped',
        queuePosition
      }
    },
    { new: true, runValidators: true }
  );

  if (!skippedAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'skipped') return serializeAdminQueueMutation(current);
    throw createError('Appointment could not be skipped', 409);
  }

  const result = await serializeAdminQueueMutation(skippedAppointment);
  const skippedNotification = await createSkippedNotification(skippedAppointment);

  return {
    ...result,
    notifications: [skippedNotification, ...result.notifications].filter(Boolean)
  };
}

export async function adminNoShowAppointment(appointmentId) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw createError('Appointment not found', 404);
  if (appointment.status === 'no_show') return serializeAdminQueueMutation(appointment);

  if (!missingCustomerStatuses.includes(appointment.status) || appointment.arrivalTime) {
    throw createError('Only a missing customer can be marked no-show');
  }

  await assertGracePeriodExceeded(appointment);

  const noShowAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $in: missingCustomerStatuses },
      arrivalTime: null
    },
    {
      $set: { status: 'no_show' },
      $unset: { queuePosition: '' }
    },
    { new: true, runValidators: true }
  );

  if (!noShowAppointment) {
    const current = await Appointment.findById(appointment._id);
    if (current?.status === 'no_show') return serializeAdminQueueMutation(current);
    throw createError('Appointment could not be marked no-show', 409);
  }

  const result = await serializeAdminQueueMutation(noShowAppointment);
  const noShowNotification = await createNoShowNotification(noShowAppointment);

  return {
    ...result,
    notifications: [noShowNotification, ...result.notifications].filter(Boolean)
  };
}

export async function selfCheckInAppointment({ bookingReference, phone }) {
  if (!bookingReference?.trim()) throw createError('Booking ID is required');
  if (!phone?.trim()) throw createError('Phone number is required');
  if (!isValidPhone(phone.trim())) throw createError('Please provide a valid phone number');

  const appointment = await Appointment.findOne({
    bookingReference: bookingReference.trim().toUpperCase()
  });

  if (!appointment || normalizePhone(appointment.customerPhone) !== normalizePhone(phone)) {
    throw createError('No booking found for the provided details', 404);
  }

  const settings = await SalonSettings.findOne();
  const windowMinutes = settings?.selfCheckInWindowMinutes || 30;
  const queueStatus = await getAppointmentQueueStatus(appointment._id);

  if (
    !isWithinCheckInWindow({
      now: currentDate(),
      expectedTurn: new Date(queueStatus.estimatedStartTime),
      windowMinutes
    })
  ) {
    throw createError(`Self check-in is available ${windowMinutes} minutes before or after your estimated turn`, 403);
  }

  return applyCheckIn(appointment);
}

async function createScheduledAppointment(payload, source = 'online') {
  const {
    customerName,
    customerPhone,
    customerEmail,
    serviceId,
    staffId,
    bookingDate: rawBookingDate,
    slotTime,
    notes
  } = payload;

  if (!customerName?.trim()) throw createError('Customer name is required');
  if (!customerPhone?.trim()) throw createError('Customer phone is required');
  if (!isValidPhone(customerPhone.trim())) throw createError('Please provide a valid phone number');
  if (!serviceId) throw createError('Service is required');
  assertObjectId(serviceId, 'service');
  assertObjectId(staffId, 'staff');
  if (!rawBookingDate) throw createError('Booking date is required');
  if (!slotTime) throw createError('Slot time is required');

  const bookingDate = new Date(`${rawBookingDate}T00:00:00`);

  if (Number.isNaN(bookingDate.getTime())) throw createError('A valid booking date is required');
  if (isPastDate(bookingDate)) throw createError('Booking date cannot be in the past');

  const service = await Service.findOne({ _id: serviceId, active: true }).populate('availableStaff');
  if (!service) throw createError('Service not found or inactive', 404);

  let requestedStaff = null;

  if (staffId && staffId !== 'any') {
    requestedStaff = await Staff.findOne({ _id: staffId, active: true });
    if (!requestedStaff) throw createError('Requested staff member not found or inactive', 404);

    const canPerform = requestedStaff.services.some((id) => id.toString() === service._id.toString());
    if (!canPerform) throw createError('Requested staff member cannot perform this service');
  }

  let appointment;
  let lastDuplicateError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const availability = await getAvailability({
      serviceId: service._id.toString(),
      staffId: requestedStaff ? requestedStaff._id.toString() : 'any',
      date: rawBookingDate
    });

    const selectedSlot = availability.slots.find((slot) => slot.time === slotTime);
    if (!selectedSlot) throw createError('Selected slot is no longer available', 409);

    const assignedStaffId = requestedStaff?._id || selectedSlot.availableStaff[0]?.id;
    if (!assignedStaffId) throw createError('No eligible staff are available for this slot', 409);

    try {
      appointment = await Appointment.create({
        bookingReference: await generateUniqueReference(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim() || undefined,
        service: service._id,
        staff: assignedStaffId,
        preferredStaff: requestedStaff?._id || null,
        bookingDate,
        slotTime,
        estimatedStartTime: buildEstimatedStartTime(rawBookingDate, slotTime),
        estimatedDuration: service.durationMinutes,
        source,
        status: 'booked',
        notes: notes?.trim() || ''
      });
      break;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      lastDuplicateError = error;
      if (requestedStaff) break;
    }
  }

  if (!appointment) {
    if (lastDuplicateError) throw createError('Selected slot is no longer available', 409);
    throw createError('Unable to create appointment', 500);
  }

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo')
    .populate('preferredStaff', 'name specialization photo');
  await createBookingConfirmedNotification(populatedAppointment);

  return serializeAppointment(populatedAppointment);
}

export async function createCustomerAppointment(payload) {
  return createScheduledAppointment(payload, 'online');
}

export async function createAdminAppointment(payload) {
  const appointment = await createScheduledAppointment(payload, 'admin');
  const savedAppointment = await Appointment.findById(appointment.id);
  return serializeAdminQueueMutation(savedAppointment);
}

export async function createWalkInAppointment(payload) {
  const { customerName, customerPhone, serviceId, staffId, notes } = payload;

  if (!customerName?.trim()) throw createError('Customer name is required');
  if (!customerPhone?.trim()) throw createError('Customer phone is required');
  if (!isValidPhone(customerPhone.trim())) throw createError('Please provide a valid phone number');
  if (!serviceId) throw createError('Service is required');

  const service = await Service.findOne({ _id: serviceId, active: true }).populate('availableStaff');
  if (!service) throw createError('Service not found or inactive', 404);

  let requestedStaff = null;

  if (staffId && staffId !== 'any') {
    requestedStaff = await Staff.findOne({ _id: staffId, active: true });
    if (!requestedStaff) throw createError('Requested staff member not found or inactive', 404);

    const canPerform = requestedStaff.services.some((id) => id.toString() === service._id.toString());
    if (!canPerform) throw createError('Requested staff member cannot perform this service');
  }

  const now = currentDate();
  const bookingDate = startOfDay(now);
  const queuePosition = await getNextQueuePosition(bookingDate);
  const bookingReference = await generateUniqueReference();

  const appointment = await Appointment.create({
    bookingReference,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    service: service._id,
    staff: requestedStaff?._id || null,
    preferredStaff: requestedStaff?._id || null,
    bookingDate,
    slotTime: timeFromDate(now),
    estimatedStartTime: addMinutes(now, Math.max(0, (queuePosition - 1) * 10)),
    estimatedDuration: service.durationMinutes,
    source: 'walk-in',
    status: 'arrived',
    queuePosition,
    arrivalTime: now,
    notes: notes?.trim() || ''
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('service', 'name slug category price durationMinutes image')
    .populate('staff', 'name specialization photo')
    .populate('preferredStaff', 'name specialization photo');
  const queueStatus = await getAppointmentQueueStatus(appointment._id);
  const queue = await getLiveQueue(appointment.bookingDate);
  const notifications = await createQueueThresholdNotifications(queue);

  return {
    appointment: serializeAppointment(populatedAppointment),
    queueStatus,
    queue,
    notifications
  };
}
