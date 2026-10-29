import { getAvailability } from '../services/availabilityService.js';

export async function getAvailableSlots(req, res, next) {
  try {
    const availability = await getAvailability(req.query);
    res.status(200).json(availability);
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}
