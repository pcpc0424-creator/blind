import { prisma, Prisma } from '@blind/database';
import {
  ERROR_CODES,
  CreateInquiryInput,
  InquiryQueryInput,
  ReplyInquiryInput,
  UpdateInquiryStatusInput,
} from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

export const inquiryService = {
  /**
   * Create a new inquiry (user)
   */
  async createInquiry(data: CreateInquiryInput, userId: string) {
    const inquiry = await prisma.inquiry.create({
      data: {
        userId,
        category: data.category,
        subject: data.subject,
        content: data.content,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return inquiry;
  },

  /**
   * Get user's own inquiries
   */
  async getUserInquiries(userId: string, query: InquiryQueryInput) {
    const { status, category, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InquiryWhereInput = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      inquiries,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Get inquiry by ID (user - only own inquiries)
   */
  async getUserInquiryById(id: string, userId: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        admin: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!inquiry) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Inquiry not found');
    }

    if (inquiry.userId !== userId) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'You can only view your own inquiries');
    }

    return inquiry;
  },

  /**
   * Get all inquiries (admin)
   */
  async getInquiries(query: InquiryQueryInput) {
    const { status, category, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InquiryWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
          admin: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      inquiries,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Get inquiry by ID (admin)
   */
  async getInquiryById(id: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        admin: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!inquiry) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Inquiry not found');
    }

    return inquiry;
  },

  /**
   * Reply to inquiry (admin)
   */
  async replyToInquiry(id: string, data: ReplyInquiryInput, adminId: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Inquiry not found');
    }

    if (inquiry.status === 'CLOSED') {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Cannot reply to a closed inquiry'
      );
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        adminReply: data.adminReply,
        repliedBy: adminId,
        repliedAt: new Date(),
        status: data.status || 'ANSWERED',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        admin: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: inquiry.userId,
        type: 'SYSTEM',
        title: 'Inquiry Response',
        body: `Your inquiry "${inquiry.subject}" has been answered.`,
        data: {
          inquiryId: inquiry.id,
        },
      },
    });

    return updatedInquiry;
  },

  /**
   * Update inquiry status (admin)
   */
  async updateInquiryStatus(id: string, data: UpdateInquiryStatusInput) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Inquiry not found');
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        admin: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return updatedInquiry;
  },

  /**
   * Get inquiry statistics (admin)
   */
  async getInquiryStats() {
    const [pending, inProgress, answered, closed] = await Promise.all([
      prisma.inquiry.count({ where: { status: 'PENDING' } }),
      prisma.inquiry.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.inquiry.count({ where: { status: 'ANSWERED' } }),
      prisma.inquiry.count({ where: { status: 'CLOSED' } }),
    ]);

    return {
      pending,
      inProgress,
      answered,
      closed,
      total: pending + inProgress + answered + closed,
    };
  },

  /**
   * Delete inquiry (admin)
   */
  async deleteInquiry(id: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Inquiry not found');
    }

    await prisma.inquiry.delete({
      where: { id },
    });

    return { success: true };
  },
};
