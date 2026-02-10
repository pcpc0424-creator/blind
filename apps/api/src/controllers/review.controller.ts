import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import { ReviewStatus } from '@blind/database';

export const reviewController = {
  // ============== Company Reviews ==============

  async getCompanyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await reviewService.getCompanyReviews(companyId, page, limit);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async createCompanyReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const review = await reviewService.createCompanyReview(req.user!.id, {
        companyId,
        ...req.body,
      });

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },

  async deleteCompanyReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const isAdmin = req.user!.role === 'ADMIN';

      const result = await reviewService.deleteCompanyReview(reviewId, req.user!.id, isAdmin);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // ============== Public Servant Reviews ==============

  async getPublicServantReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await reviewService.getPublicServantReviews(categoryId, page, limit);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async createPublicServantReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const review = await reviewService.createPublicServantReview(req.user!.id, {
        categoryId,
        ...req.body,
      });

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },

  async deletePublicServantReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const isAdmin = req.user!.role === 'ADMIN';

      const result = await reviewService.deletePublicServantReview(reviewId, req.user!.id, isAdmin);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // ============== Admin ==============

  async adminGetReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params as { type: 'company' | 'public-servant' };
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as ReviewStatus | undefined;

      const result = await reviewService.adminGetReviews(type, page, limit, status);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, reviewId } = req.params as { type: 'company' | 'public-servant'; reviewId: string };
      const { status } = req.body as { status: ReviewStatus };

      const review = await reviewService.adminUpdateReviewStatus(type, reviewId, status);

      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },
};
