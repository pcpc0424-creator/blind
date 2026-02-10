import { Request, Response, NextFunction } from 'express';
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
  voteSchema,
} from '@blind/shared';
import { commentService } from '../services/comment.service';

export const commentController = {
  /**
   * GET /posts/:postId/comments
   * Get comments for a post
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const query = commentQuerySchema.parse({ ...req.query, postId });
      const result = await commentService.getComments(query, req.user?.id);

      res.status(200).json({
        success: true,
        data: result.comments,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /posts/:postId/comments
   * Create a comment
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const input = createCommentSchema.parse({ ...req.body, postId });
      const comment = await commentService.createComment(input, req.user!.id);

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /comments/:id
   * Update a comment
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = updateCommentSchema.parse(req.body);
      const result = await commentService.updateComment(id, input, req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /comments/:id
   * Delete a comment
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await commentService.deleteComment(id, req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /comments/:id/vote
   * Vote on a comment
   */
  async vote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = voteSchema.parse(req.body);
      const result = await commentService.voteComment(id, req.user!.id, input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  /**
   * GET /comments/admin
   * Get all comments (admin)
   */
  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, page = '1', limit = '20' } = req.query;
      const result = await commentService.getAdminComments({
        search: search as string,
        status: status as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.status(200).json({
        success: true,
        data: result.comments,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /comments/:id/toggle-hide
   * Toggle hide status (admin)
   */
  async adminToggleHide(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await commentService.adminToggleHide(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /comments/:id/admin
   * Delete comment (admin)
   */
  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await commentService.adminDeleteComment(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
