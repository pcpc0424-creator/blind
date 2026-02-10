import { Request, Response, NextFunction } from 'express';
import { publicServantService } from '../services/public-servant.service';

export const publicServantController = {
  /**
   * GET /public-servants
   * Get list of public servant categories
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await publicServantService.getCategories({
        search,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.categories,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /public-servants/search
   * Search public servant categories for autocomplete
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const categories = await publicServantService.searchCategories(query, limit);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /public-servants/:slug
   * Get public servant category by slug
   */
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const category = await publicServantService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============== Admin Functions ==============

  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await publicServantService.getAdminList();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async adminGetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await publicServantService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await publicServantService.adminCreate(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await publicServantService.adminUpdate(id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await publicServantService.adminDelete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
