import { env } from '../config/env.js';
import Admin from '../models/Admin.js';
import { serializeAdmin } from '../utils/adminSerializer.js';
import { signAdminToken } from '../utils/jwt.js';

function setAuthCookie(res, token) {
  res.cookie('adminToken', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: env.jwtCookieExpiresDays * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookie(res) {
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax'
  });
}

export async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = signAdminToken(admin);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      admin: serializeAdmin(admin)
    });
  } catch (error) {
    next(error);
  }
}

export function getCurrentAdmin(req, res) {
  res.status(200).json({
    success: true,
    admin: serializeAdmin(req.admin)
  });
}

export function logoutAdmin(_req, res) {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}
