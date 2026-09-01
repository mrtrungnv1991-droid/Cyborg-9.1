import { Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { ServerUser, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: ServerUser;
}

// Role hierarchy levels for RBAC
const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  SELLER: 2,
  SUPPLIER: 2,
  SUPPORT: 3,
  MODERATOR: 4,
  FINANCE: 5,
  ADMIN: 6,
  SUPER_ADMIN: 7
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userIdHeader = req.headers['x-user-id'] as string;

  let targetUserId = 'usr-buyer-01'; // Default test user
  if (token && db.users.has(token)) {
    targetUserId = token;
  } else if (userIdHeader && db.users.has(userIdHeader)) {
    targetUserId = userIdHeader;
  }

  const user = db.users.get(targetUserId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized: User session invalid' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ success: false, error: 'Forbidden: Account has been suspended' });
  }

  req.user = user;
  next();
};

export const requireRole = (minimumRole: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        success: false, 
        error: `Forbidden: Requires role [${minimumRole}] or higher. Your role is [${req.user.role}]` 
      });
    }

    next();
  };
};
