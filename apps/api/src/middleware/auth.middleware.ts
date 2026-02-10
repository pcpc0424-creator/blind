import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@blind/database';
import { ERROR_CODES } from '@blind/shared';
import config from '../config';
import { AppError } from './error.middleware';

export interface JwtPayload {
  userId: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        nickname: string;
        companyId: string | null;
        companyVerified: boolean;
        role: 'USER' | 'MODERATOR' | 'ADMIN';
        sessionId: string;
      };
    }
  }
}

/**
 * Extract JWT token from request
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
}

/**
 * Authenticate user from JWT token
 * Required: Will throw error if not authenticated
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required.');
    }

    // Verify JWT
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      throw new AppError(401, ERROR_CODES.SESSION_EXPIRED, 'Session expired. Please log in again.');
    }

    // Verify session exists and is valid
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            companyId: true,
            companyVerified: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError(401, ERROR_CODES.SESSION_EXPIRED, 'Session expired. Please log in again.');
    }

    if (session.user.status !== 'ACTIVE') {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Account has been suspended.');
    }

    // Update last used time
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach user to request
    req.user = {
      id: session.user.id,
      nickname: session.user.nickname,
      companyId: session.user.companyId,
      companyVerified: session.user.companyVerified,
      role: session.user.role,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication
 * Attaches user to request if authenticated, continues otherwise
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            companyId: true,
            companyVerified: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (session && session.expiresAt > new Date() && session.user.status === 'ACTIVE') {
      req.user = {
        id: session.user.id,
        nickname: session.user.nickname,
        companyId: session.user.companyId,
        companyVerified: session.user.companyVerified,
        role: session.user.role,
        sessionId: session.id,
      };
    }

    next();
  } catch {
    next();
  }
};

/**
 * Require specific roles
 */
export const requireRole = (...roles: ('USER' | 'MODERATOR' | 'ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, ERROR_CODES.FORBIDDEN, 'Permission denied.'));
    }

    next();
  };
};

/**
 * Require company verification for company-specific features
 */
export const requireCompanyVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required.'));
  }

  if (!req.user.companyVerified) {
    return next(
      new AppError(403, ERROR_CODES.COMPANY_VERIFICATION_REQUIRED, 'Company verification required.')
    );
  }

  next();
};

/**
 * Require admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required.'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new AppError(403, ERROR_CODES.FORBIDDEN, 'Admin permission required.'));
  }

  next();
};
