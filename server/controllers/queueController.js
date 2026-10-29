import { getAppointmentQueueStatus, getLiveQueue } from '../services/queueService.js';

export async function getAdminLiveQueue(req, res, next) {
  try {
    const queue = await getLiveQueue(req.query.date ? new Date(`${req.query.date}T00:00:00`) : new Date());

    res.status(200).json({
      success: true,
      queue
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerQueueStatus(req, res, next) {
  try {
    const queueStatus = await getAppointmentQueueStatus(req.params.id);

    res.status(200).json({
      success: true,
      queueStatus
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}
