import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAdminToken(admin) {
  if (
    env.nodeEnv === 'production' &&
    ['development-secret', 'replace-with-a-long-random-production-secret'].includes(env.jwtSecret)
  ) {
    throw new Error('JWT_SECRET must be configured in production');
  }

  return jwt.sign(
    {
      id: admin._id.toString(),
      role: admin.role,
      tokenVersion: admin.updatedAt?.getTime()
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
