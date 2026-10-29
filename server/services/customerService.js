import Appointment from '../models/Appointment.js';

function normalizePhone(phone = '') {
  return phone.replace(/\D/g, '');
}

function maskPhone(phone = '') {
  const digits = normalizePhone(phone);
  if (digits.length <= 4) return phone;
  return `${digits.slice(0, 2)}${'X'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-2)}`;
}

function serializeService(service) {
  if (!service) return null;

  return {
    id: service._id,
    name: service.name,
    category: service.category
  };
}

function summarizeCustomer(phone, appointments) {
  const sorted = [...appointments].sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
  const completedAppointments = appointments.filter((appointment) => appointment.status === 'completed');
  const noShowAppointments = appointments.filter((appointment) => appointment.status === 'no_show');
  const serviceCounts = new Map();

  completedAppointments.forEach((appointment) => {
    const key = appointment.service?._id?.toString();
    if (!key) return;
    const current = serviceCounts.get(key) || { service: appointment.service, count: 0 };
    current.count += 1;
    serviceCounts.set(key, current);
  });

  const commonService = [...serviceCounts.values()].sort((a, b) => b.count - a.count)[0];
  const lastVisit = completedAppointments.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))[0] || sorted[0];

  return {
    id: phone,
    name: sorted[0]?.customerName || 'Customer',
    phone,
    maskedPhone: maskPhone(phone),
    email: sorted.find((appointment) => appointment.customerEmail)?.customerEmail || '',
    totalVisits: appointments.length,
    completed: completedAppointments.length,
    noShows: noShowAppointments.length,
    lastVisit: lastVisit?.bookingDate || null,
    commonService: commonService
      ? {
          ...serializeService(commonService.service),
          count: commonService.count
        }
      : null,
    recentAppointments: sorted.slice(0, 5).map((appointment) => ({
      id: appointment._id,
      bookingReference: appointment.bookingReference,
      bookingDate: appointment.bookingDate,
      slotTime: appointment.slotTime,
      status: appointment.status,
      source: appointment.source,
      service: serializeService(appointment.service),
      staff: appointment.staff
        ? {
            id: appointment.staff._id,
            name: appointment.staff.name
          }
        : null
    }))
  };
}

export async function listCustomerHistory({ search = '' } = {}) {
  const cleanSearch = search.trim();
  const query = {};

  if (cleanSearch) {
    const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [{ customerName: searchRegex }, { customerPhone: searchRegex }, { bookingReference: searchRegex }];
  }

  const appointments = await Appointment.find(query)
    .populate('service', 'name category')
    .populate('staff', 'name')
    .sort({ bookingDate: -1, createdAt: -1 });

  const grouped = new Map();

  appointments.forEach((appointment) => {
    const phone = normalizePhone(appointment.customerPhone);
    if (!phone) return;
    grouped.set(phone, [...(grouped.get(phone) || []), appointment]);
  });

  return [...grouped.entries()]
    .map(([phone, customerAppointments]) => summarizeCustomer(phone, customerAppointments))
    .sort((a, b) => new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0));
}
