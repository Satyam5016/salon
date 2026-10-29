import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import helmet from 'helmet';
import { env } from '../config/env.js';

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again shortly.'
  }
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again shortly.'
  }
});

export const sanitizeMongoPayload = mongoSanitize({
  replaceWith: '_'
});

function containsMongoOperator(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsMongoOperator);

  return Object.entries(value).some(([key, child]) => key.startsWith('$') || key.includes('.') || containsMongoOperator(child));
}

export function rejectMongoOperators(req, res, next) {
  if (containsMongoOperator(req.body) || containsMongoOperator(req.query) || containsMongoOperator(req.params)) {
    res.status(400);
    return next(new Error('Invalid request payload'));
  }

  return next();
}

export function validateObjectIdParam(req, res, next, value, name) {
  if (name === 'id' && !mongoose.Types.ObjectId.isValid(value)) {
    res.status(400);
    return next(new Error('Invalid resource id'));
  }

  return next();
}
