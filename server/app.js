import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import {
  apiRateLimiter,
  rejectMongoOperators,
  sanitizeMongoPayload,
  securityHeaders,
  validateObjectIdParam
} from './middleware/securityMiddleware.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminAppointmentRoutes from './routes/adminAppointmentRoutes.js';
import adminCustomerRoutes from './routes/adminCustomerRoutes.js';
import adminGalleryRoutes from './routes/adminGalleryRoutes.js';
import adminOfferRoutes from './routes/adminOfferRoutes.js';
import adminQueueRoutes from './routes/adminQueueRoutes.js';
import adminSettingsRoutes from './routes/adminSettingsRoutes.js';
import adminServiceRoutes from './routes/adminServiceRoutes.js';
import adminStaffRoutes from './routes/adminStaffRoutes.js';
import adminWalkInRoutes from './routes/adminWalkInRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

const app = express();

app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(rejectMongoOperators);
app.use(sanitizeMongoPayload);
app.use('/api', apiRateLimiter);
app.param('id', validateObjectIdParam);

app.use('/api/health', healthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/appointments', adminAppointmentRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/admin/gallery', adminGalleryRoutes);
app.use('/api/admin/offers', adminOfferRoutes);
app.use('/api/admin/queue', adminQueueRoutes);
app.use('/api/admin/services', adminServiceRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/admin/walk-ins', adminWalkInRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
