import { Request, Response, NextFunction } from 'express';
import {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  voteSchema,
} from '@blind/shared';
import { postService } from '../services/post.service';

export const postController = {
  /**
   * GET /posts
   * Get posts feed
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = postQuerySchema.parse(req.query);
      const result = await postService.getPosts(
        query,
        req.user?.id,
        req.user?.companyId,
        req.user?.role === 'ADMIN'
      );

      res.status(200).json({
        success: true,
        data: result.posts,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /posts/trending
   * Get trending posts
   */
  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await postService.getTrendingPosts(
        limit,
        req.user?.id,
        req.user?.companyId
      );

      res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /posts/:id
   * Get post by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const post = await postService.getPostById(
        id,
        req.user?.id,
        req.user?.companyId,
        req.user?.role === 'ADMIN'
      );

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /posts
   * Create a new post
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createPostSchema.parse(req.body);
      const result = await postService.createPost(input, req.user!.id);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /posts/:id
   * Update a post
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = updatePostSchema.parse(req.body);
      const result = await postService.updatePost(id, input, req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /posts/:id
   * Delete a post
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await postService.deletePost(id, req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /posts/:id/vote
   * Vote on a post
   */
  async vote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = voteSchema.parse(req.body);
      const result = await postService.votePost(id, req.user!.id, input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /posts/:id/bookmark
   * Toggle bookmark on a post
   */
  async bookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await postService.bookmarkPost(id, req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /posts/bookmarks
   * Get user's bookmarked posts
   */
  async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20' } = req.query;
      const result = await postService.getBookmarkedPosts(
        req.user!.id,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============== Admin Functions ==============

  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, page = '1', limit = '20' } = req.query;
      const result = await postService.getAdminList({
        search: search as string,
        status: status as string,
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
      const stats = await postService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const post = await postService.adminUpdateStatus(id, status);
      res.json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  },

  async adminTogglePin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const post = await postService.adminTogglePin(id);
      res.json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  },

  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await postService.adminDelete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
