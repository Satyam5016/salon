import SalonSettings from '../models/SalonSettings.js';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const editableFields = [
  'salonName',
  'phone',
  'whatsapp',
  'email',
  'address',
  'openingTime',
  'closingTime',
  'bookingIntervalMinutes',
  'gracePeriodMinutes',
  'notificationThresholdMinutes',
  'numberOfChairs',
  'timezone',
  'maxAdvanceBookingDays',
  'selfCheckInWindowMinutes',
  'cancellationCutoffMinutes'
];

const numericFields = [
  'bookingIntervalMinutes',
  'gracePeriodMinutes',
  'notificationThresholdMinutes',
  'numberOfChairs',
  'maxAdvanceBookingDays',
  'selfCheckInWindowMinutes',
  'cancellationCutoffMinutes'
];

function settingsPayload(body) {
  const payload = {};

  editableFields.forEach((field) => {
    if (body[field] === undefined) return;
    payload[field] = numericFields.includes(field) ? Number(body[field]) : body[field];
  });

  return payload;
}

function validateSettings(payload) {
  if (payload.openingTime && !timePattern.test(payload.openingTime)) return 'Opening time must use HH:mm format';
  if (payload.closingTime && !timePattern.test(payload.closingTime)) return 'Closing time must use HH:mm format';

  for (const field of numericFields) {
    if (payload[field] !== undefined && (!Number.isFinite(payload[field]) || payload[field] < 0)) {
      return `${field} must be a valid positive number`;
    }
  }

  if (payload.bookingIntervalMinutes !== undefined && payload.bookingIntervalMinutes < 5) {
    return 'Booking interval must be at least 5 minutes';
  }

  if (payload.numberOfChairs !== undefined && payload.numberOfChairs < 1) {
    return 'Number of chairs must be at least 1';
  }

  if (payload.maxAdvanceBookingDays !== undefined && payload.maxAdvanceBookingDays < 1) {
    return 'Maximum advance booking days must be at least 1';
  }

  return '';
}

async function getOrCreateSettings() {
  let settings = await SalonSettings.findOne();

  if (!settings) {
    settings = await SalonSettings.create({
      salonName: 'Bliss Beauty Salon',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      email: 'hello@blissbeautysalon.com',
      address: '18 Rose Avenue, Bandra West, Mumbai, Maharashtra',
      openingTime: '09:00',
      closingTime: '20:00',
      cancellationCutoffMinutes: 60
    });
  }

  return settings;
}

function publicSettings(settings) {
  return {
    salonName: settings.salonName,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    timezone: settings.timezone
  };
}

export async function getSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      settings: req.admin ? settings : publicSettings(settings)
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const payload = settingsPayload(req.body);
    const validationError = validateSettings(payload);

    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const existing = await getOrCreateSettings();
    const settings = await SalonSettings.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Salon settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
}
