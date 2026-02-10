import { Request, Response, NextFunction } from 'express';
import { tagService } from '../services/tag.service';

export const tagController = {
  /**
   * GET /tags
   * Get all tags
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const tags = await tagService.getTags(limit);

      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /tags/trending
   * Get trending tags
   */
  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tags = await tagService.getTrendingTags(limit);

      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============== Admin Functions ==============

  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page = '1', limit = '50' } = req.query;
      const result = await tagService.getAdminList({
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async adminGetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await tagService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.adminCreate(req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tag = await tagService.adminUpdate(id, req.body);
      res.json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  },

  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await tagService.adminDelete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async adminMerge(req: Request, res: Response, next: NextFunction) {
    try {
      const { sourceId, targetId } = req.body;
      await tagService.adminMerge(sourceId, targetId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
