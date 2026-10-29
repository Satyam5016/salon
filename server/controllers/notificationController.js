import { markBrowserNotificationSent } from '../services/notificationService.js';

export async function acknowledgeBrowserNotification(req, res, next) {
  try {
    const notification = await markBrowserNotificationSent(req.params.id);

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
}
