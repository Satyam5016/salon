import Appointment from '../models/Appointment.js';
import SalonSettings from '../models/SalonSettings.js';
import Service from '../models/Service.js';

const blockingStatuses = ['booked', 'confirmed', 'notified', 'arrived', 'waiting', 'in_service', 'late', 'skipped'];
const nonBlockingStatuses = ['completed', 'cancelled', 'no_show'];
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function formatLabel(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function parseBookingDate(date) {
  const bookingDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(bookingDate.getTime())) {
    const error = new Error('A valid booking date is required');
    error.statusCode = 400;
    throw error;
  }

  return bookingDate;
}

function isPastDate(date) {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

function isBeyondAdvanceBookingWindow(date, maxAdvanceBookingDays) {
  const latestDate = startOfDay(new Date());
  latestDate.setDate(latestDate.getDate() + maxAdvanceBookingDays);
  return startOfDay(date).getTime() > latestDate.getTime();
}

function createUnavailableResult(reason) {
  return {
    success: true,
    available: false,
    closed: true,
    reason,
    slots: []
  };
}

function staffCanPerformService(member, serviceId) {
  return member.services?.some((service) => service.toString() === serviceId.toString());
}

function staffWorksOnDate(member, bookingDate) {
  const weekday = dayNames[bookingDate.getDay()];
  return member.workingDays.includes(weekday);
}

function staffCoversSlot(member, slotStart, durationMinutes) {
  const workingStart = toMinutes(member.workingHours.start);
  const workingEnd = toMinutes(member.workingHours.end);
  const slotEnd = slotStart + durationMinutes;

  return slotStart >= workingStart && slotEnd <= workingEnd;
}

function staffHasConflict(member, slotStart, durationMinutes, appointments) {
  const slotEnd = slotStart + durationMinutes;

  return appointments.some((appointment) => {
    if (appointment.staff?.toString() !== member._id.toString()) return false;

    const appointmentStart = toMinutes(appointment.slotTime);
    const appointmentEnd = appointmentStart + appointment.estimatedDuration;
    return rangesOverlap(slotStart, slotEnd, appointmentStart, appointmentEnd);
  });
}

function staffAvailableAt({ member, bookingDate, serviceId, slotStart, durationMinutes, appointments }) {
  if (!member.active) return false;
  if (!staffCanPerformService(member, serviceId)) return false;
  if (!staffWorksOnDate(member, bookingDate)) return false;
  if (!staffCoversSlot(member, slotStart, durationMinutes)) return false;
  if (staffHasConflict(member, slotStart, durationMinutes, appointments)) return false;

  return true;
}

async function getBlockingAppointments(bookingDate, excludeAppointmentId) {
  const nextDate = new Date(bookingDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const query = {
    bookingDate: {
      $gte: bookingDate,
      $lt: nextDate
    },
    status: { $in: blockingStatuses, $nin: nonBlockingStatuses },
    staff: { $ne: null }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return Appointment.find(query).select('staff slotTime estimatedDuration status');
}

async function getEligibleStaff({ service, staffId }) {
  let eligibleStaff = service.availableStaff.filter((member) => member.active && staffCanPerformService(member, service._id));

  if (staffId && staffId !== 'any') {
    eligibleStaff = eligibleStaff.filter((member) => member._id.toString() === staffId);

    if (eligibleStaff.length === 0) {
      const error = new Error('Selected stylist cannot perform this service or is unavailable');
      error.statusCode = 400;
      throw error;
    }
  }

  return eligibleStaff;
}

export async function getAvailability({ serviceId, staffId = 'any', date, excludeAppointmentId }) {
  if (!serviceId || !date) {
    const error = new Error('serviceId and date are required');
    error.statusCode = 400;
    throw error;
  }

  const bookingDate = parseBookingDate(date);

  if (isPastDate(bookingDate)) {
    return createUnavailableResult('Past dates cannot be booked');
  }

  const service = await Service.findOne({ _id: serviceId, active: true }).populate('availableStaff');

  if (!service) {
    const error = new Error('Service not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  const eligibleStaff = await getEligibleStaff({ service, staffId });

  if (eligibleStaff.length === 0) {
    return createUnavailableResult('No eligible active staff are available for this service');
  }

  const settings = await SalonSettings.findOne();
  const openingTime = settings?.openingTime || '09:00';
  const closingTime = settings?.closingTime || '20:00';
  const bookingIntervalMinutes = settings?.bookingIntervalMinutes || 15;
  const maxAdvanceBookingDays = settings?.maxAdvanceBookingDays || 30;

  if (isBeyondAdvanceBookingWindow(bookingDate, maxAdvanceBookingDays)) {
    return createUnavailableResult(`Bookings are only available up to ${maxAdvanceBookingDays} days in advance`);
  }

  const openingMinutes = toMinutes(openingTime);
  const closingMinutes = toMinutes(closingTime);
  const appointments = await getBlockingAppointments(bookingDate, excludeAppointmentId);
  const slots = [];

  for (
    let slotStart = openingMinutes;
    slotStart + service.durationMinutes <= closingMinutes;
    slotStart += bookingIntervalMinutes
  ) {
    const availableStaff = eligibleStaff
      .filter((member) =>
        staffAvailableAt({
          member,
          bookingDate,
          serviceId: service._id,
          slotStart,
          durationMinutes: service.durationMinutes,
          appointments
        })
      )
      .map((member) => ({
        id: member._id,
        name: member.name
      }));

    if (availableStaff.length > 0) {
      const time = toTime(slotStart);
      slots.push({
        time,
        label: formatLabel(time),
        durationMinutes: service.durationMinutes,
        availableStaff
      });
    }
  }

  return {
    success: true,
    available: slots.length > 0,
    closed: slots.length === 0,
    reason: slots.length === 0 ? 'No slots are available for the selected date' : '',
    service: {
      id: service._id,
      name: service.name,
      durationMinutes: service.durationMinutes
    },
    salon: {
      openingTime,
      closingTime,
      timezone: settings?.timezone || 'Asia/Kolkata',
      bookingIntervalMinutes,
      maxAdvanceBookingDays
    },
    staffMode: staffId && staffId !== 'any' ? 'specific' : 'any',
    slots
  };
}
