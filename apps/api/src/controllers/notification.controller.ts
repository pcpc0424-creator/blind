import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

export const notificationController = {
  /**
   * GET /notifications
   * Get notifications for current user
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', unreadOnly } = req.query;
      const result = await notificationService.getNotifications(req.user!.id, {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        unreadOnly: unreadOnly === 'true',
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await notificationService.markAsRead(id, req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await notificationService.deleteNotification(id, req.user!.id);

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
   * GET /notifications/admin
   * Get all notifications (admin)
   */
  async adminGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, type, page = '1', limit = '20' } = req.query;
      const result = await notificationService.getAdminNotifications({
        search: search as string,
        type: type as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /notifications/admin/send
   * Send notification to a user (admin)
   */
  async adminSend(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, title, body, data } = req.body;
      const result = await notificationService.sendNotification({
        userId,
        title,
        body,
        data,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /notifications/admin/broadcast
   * Send notification to all users (admin)
   */
  async adminBroadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, body, data } = req.body;
      const result = await notificationService.sendBroadcastNotification({
        title,
        body,
        data,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /notifications/:id/admin
   * Delete notification (admin)
   */
  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await notificationService.adminDeleteNotification(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /notifications/admin/users
   * Get users for target selection (admin)
   */
  async adminGetUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page = '1', limit = '20' } = req.query;
      const result = await notificationService.getUsers({
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.status(200).json({
        success: true,
        data: result.users,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },
};
