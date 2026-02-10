import { Request, Response, NextFunction } from 'express';
import { communityRequestService } from '../services/community-request.service';
import { AppError } from '../middleware/error.middleware';

export const communityRequestController = {
  /**
   * POST /community-requests
   * Create a new community request
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, description, targetType, companyId, publicServantCategoryId, interestCategoryId } = req.body;

      if (!name || !targetType) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Community name and type are required.');
      }

      const validTypes = ['COMPANY', 'PUBLIC_SERVANT', 'INTEREST', 'GENERAL'];
      if (!validTypes.includes(targetType)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request type.');
      }

      const request = await communityRequestService.createRequest({
        userId,
        name,
        description,
        targetType,
        companyId,
        publicServantCategoryId,
        interestCategoryId,
      });

      res.status(201).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /community-requests/my
   * Get current user's requests
   */
  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await communityRequestService.getUserRequests(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result.requests,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /community-requests/:id
   * Cancel a pending request
   */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const request = await communityRequestService.cancelRequest(id, userId);

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /community-requests/admin
   * Get all requests for admin
   */
  async getAdminList(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Admin access required');
      }

      const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | undefined;
      const targetType = req.query.targetType as 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL' | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await communityRequestService.getAdminRequests({
        status,
        targetType,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.requests,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /community-requests/:id/review
   * Approve or reject a request (admin only)
   */
  async review(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Admin access required');
      }

      const { id } = req.params;
      const { status, adminNote } = req.body;

      if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Status must be APPROVED or REJECTED.');
      }

      const request = await communityRequestService.reviewRequest({
        requestId: id,
        reviewerId: req.user.id,
        status,
        adminNote,
      });

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  },
};
