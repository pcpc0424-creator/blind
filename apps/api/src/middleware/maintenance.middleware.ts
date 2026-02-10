import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '@blind/shared';
import { settingsService } from '../services/settings.service';
import { AppError } from './error.middleware';

/**
 * Check maintenance mode and block non-admin users
 */
export const checkMaintenanceMode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const setting = await settingsService.getSetting('site.maintenanceMode');
    const isMaintenanceMode = setting?.value === true;

    if (!isMaintenanceMode) {
      return next();
    }

    // Allow admin users to access
    if (req.user?.role === 'ADMIN') {
      return next();
    }

    // Allow settings API for admins to disable maintenance mode
    if (req.path.startsWith('/api/v1/settings')) {
      return next();
    }

    // Allow auth routes for admin login
    if (req.path.startsWith('/api/v1/auth/login')) {
      return next();
    }

    throw new AppError(
      503,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'The site is currently under maintenance. Please try again later.'
    );
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    // If settings service fails, continue (don't block on settings failure)
    next();
  }
};
