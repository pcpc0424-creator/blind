import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middleware/error.middleware';
import { ERROR_CODES } from '@blind/shared';
import { UserRole, UserStatus } from '@prisma/client';

export const userController = {
  // Admin user list
  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, role, status, companyVerified } = req.query;

      const result = await userService.getAdminList({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        search: search as string,
        role: role as UserRole,
        status: status as UserStatus,
        companyVerified: companyVerified === 'true' ? true : companyVerified === 'false' ? false : undefined,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  async adminGetById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getById(id);

      if (!user) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found.');
      }

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // Update role
  async adminUpdateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid role.');
      }

      const user = await userService.updateRole(id, role);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // Update status
  async adminUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'SUSPENDED', 'DELETED'].includes(status)) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid status.');
      }

      const user = await userService.updateStatus(id, status);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // Suspend user
  async adminSuspend(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.suspendUser(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // Activate user
  async adminActivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.activateUser(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // Statistics
  async adminGetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await userService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};
