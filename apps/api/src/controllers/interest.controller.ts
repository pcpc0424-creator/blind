import { Request, Response, NextFunction } from 'express';
import { interestService } from '../services/interest.service';

export const interestController = {
  /**
   * GET /interests
   * Get list of interest categories
   * Query params:
   *   - parentId: null for top-level only, or ID for specific parent's children
   *   - search: search term
   *   - page, limit: pagination
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      // Handle parentId: 'null' string means top-level, undefined means all
      let parentId: string | null | undefined = undefined;
      if (req.query.parentId === 'null' || req.query.parentId === '') {
        parentId = null;
      } else if (req.query.parentId) {
        parentId = req.query.parentId as string;
      }

      const result = await interestService.getCategories({
        search,
        page,
        limit,
        parentId,
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
   * GET /interests/search
   * Search interest categories for autocomplete
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const categories = await interestService.searchCategories(query, limit);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /interests/:slug
   * Get interest category by slug
   */
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const category = await interestService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /interests/:slug/hot-posts
   * Get hot posts from interest category and its subcategories
   */
  async getHotPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      // First get the category to get its ID
      const category = await interestService.getCategoryBySlug(slug);
      const hotPosts = await interestService.getHotPosts(category.id, limit);

      res.status(200).json({
        success: true,
        data: hotPosts,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============== Admin Functions ==============

  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await interestService.getAdminList();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async adminGetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await interestService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await interestService.adminCreate(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await interestService.adminUpdate(id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await interestService.adminDelete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async adminReorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      await interestService.adminReorder(items);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
