import { Request, Response, NextFunction } from 'express';
import { communityQuerySchema, joinCommunitySchema } from '@blind/shared';
import { communityService } from '../services/community.service';

export const communityController = {
  /**
   * GET /communities
   * Get list of communities
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = communityQuerySchema.parse(req.query);
      const result = await communityService.getCommunities(
        query,
        req.user?.id,
        req.user?.companyId
      );

      res.status(200).json({
        success: true,
        data: result.communities,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /communities/:slug
   * Get community by slug
   */
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const community = await communityService.getCommunityBySlug(
        slug,
        req.user?.id,
        req.user?.companyId,
        req.user?.role === 'ADMIN'
      );

      res.status(200).json({
        success: true,
        data: community,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /communities/:slug/join
   * Join a community
   */
  async join(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const community = await communityService.getCommunityBySlug(slug);
      const result = await communityService.joinCommunity(
        community.id,
        req.user!.id,
        req.user!.companyId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /communities/:slug/leave
   * Leave a community
   */
  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const community = await communityService.getCommunityBySlug(slug);
      const result = await communityService.leaveCommunity(community.id, req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /communities/me
   * Get user's joined communities
   */
  async getMyCommunities(req: Request, res: Response, next: NextFunction) {
    try {
      const communities = await communityService.getUserCommunities(req.user!.id);

      res.status(200).json({
        success: true,
        data: communities,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============== Admin Functions ==============

  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, type, page = '1', limit = '20' } = req.query;
      const result = await communityService.getAdminList({
        search: search as string,
        type: type as string,
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
      const stats = await communityService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const community = await communityService.adminCreate(req.body);
      res.status(201).json({ success: true, data: community });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const community = await communityService.adminUpdate(id, req.body);
      res.json({ success: true, data: community });
    } catch (error) {
      next(error);
    }
  },

  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await communityService.adminDelete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
