import { prisma, Prisma } from '@blind/database';
import { ERROR_CODES } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, query: { page: number; limit: number; unreadOnly?: boolean }) {
    const { page, limit, unreadOnly } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        unreadCount,
      },
    };
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Notification not found.');
    }

    if (notification.userId !== userId) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Permission denied.');
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'Notification marked as read.' };
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'All notifications marked as read.' };
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Notification not found.');
    }

    if (notification.userId !== userId) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Permission denied.');
    }

    await prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted.' };
  },

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  /**
   * Get all notifications (admin)
   */
  async getAdminNotifications(query: {
    search?: string;
    type?: string;
    page: number;
    limit: number;
  }) {
    const { search, type, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && type !== 'all') {
      where.type = type as any;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString(),
        user: {
          id: n.user.id,
          nickname: n.user.nickname,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Send system notification to a user (admin)
   */
  async sendNotification(input: {
    userId: string;
    title: string;
    body: string;
    data?: any;
  }) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });

    if (!user) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found.');
    }

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: 'SYSTEM',
        title: input.title,
        body: input.body,
        data: input.data || null,
      },
    });

    return {
      id: notification.id,
      message: 'Notification sent.',
    };
  },

  /**
   * Send system notification to all users (admin)
   */
  async sendBroadcastNotification(input: {
    title: string;
    body: string;
    data?: any;
  }) {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const notifications = await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: 'SYSTEM' as const,
        title: input.title,
        body: input.body,
        data: input.data || null,
      })),
    });

    return {
      count: notifications.count,
      message: `Notification sent to ${notifications.count} users.`,
    };
  },

  /**
   * Delete notification (admin)
   */
  async adminDeleteNotification(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Notification not found.');
    }

    await prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted.' };
  },

  /**
   * Get all users for notification target selection (admin)
   */
  async getUsers(query: { search?: string; page: number; limit: number }) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { status: 'ACTIVE' };
    if (search) {
      where.nickname = { contains: search, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, nickname: true, role: true },
        orderBy: { nickname: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },
};
