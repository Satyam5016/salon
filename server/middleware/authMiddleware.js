import Admin from '../models/Admin.js';
import { verifyToken } from '../utils/jwt.js';

function getToken(req) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return req.cookies?.adminToken;
}

export async function protectAdmin(req, res, next) {
  try {
    const token = getToken(req);

    if (!token) {
      res.status(401);
      throw new Error('Authentication required');
    }

    const decoded = verifyToken(token);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      res.status(401);
      throw new Error('Admin account no longer exists');
    }

    const tokenVersion = admin.updatedAt?.getTime();

    if (admin.role !== decoded.role || (decoded.tokenVersion && decoded.tokenVersion !== tokenVersion)) {
      res.status(401);
      throw new Error('Admin account no longer exists');
    }

    req.admin = admin;
    next();
  } catch {
    if (res.statusCode === 200) res.status(401);
    next(new Error('Authentication required'));
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      res.status(403);
      return next(new Error('You do not have permission to perform this action'));
    }

    return next();
  };
}
