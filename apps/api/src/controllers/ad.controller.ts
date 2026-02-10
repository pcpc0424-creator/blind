import { Request, Response, NextFunction } from 'express';
import { adService } from '../services/ad.service';

export const adController = {
  // Get active ads for a placement
  async getAds(req: Request, res: Response, next: NextFunction) {
    try {
      const placement = (req.query.placement as string) || 'ALL';
      const ads = await adService.getActiveAds(placement);

      res.json({
        success: true,
        data: ads,
      });
    } catch (error) {
      next(error);
    }
  },

  // Record impression
  async recordImpression(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await adService.recordImpression(id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // Record click
  async recordClick(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await adService.recordClick(id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Get all ads
  async getAllAds(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adService.getAllAds(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Create ad
  async createAd(req: Request, res: Response, next: NextFunction) {
    try {
      const ad = await adService.createAd(req.body);

      res.status(201).json({
        success: true,
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Update ad
  async updateAd(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ad = await adService.updateAd(id, req.body);

      res.json({
        success: true,
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Delete ad
  async deleteAd(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await adService.deleteAd(id);

      res.json({
        success: true,
        message: 'Ad deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Get ad stats
  async getAdStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const stats = await adService.getAdStats(id);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Ad not found',
        });
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};
