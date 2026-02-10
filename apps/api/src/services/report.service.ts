import { prisma, Prisma } from '@blind/database';
import {
  ERROR_CODES,
  CreateReportInput,
  ReportQueryInput,
  ResolveReportInput,
} from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

export const reportService = {
  /**
   * Create a new report
   */
  async createReport(data: CreateReportInput, reporterId: string) {
    const { postId, commentId, reportedUserId, reason, description } = data;

    // At least one target must be specified
    if (!postId && !commentId && !reportedUserId) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Report target is required'
      );
    }

    // Check if target exists and get the reported user
    let targetUserId: string | undefined;

    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, status: true },
      });
      if (!post || post.status === 'DELETED') {
        throw new AppError(
          404,
          ERROR_CODES.NOT_FOUND,
          'Post not found'
        );
      }
      targetUserId = post.authorId;
    }

    if (commentId) {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, status: true },
      });
      if (!comment || comment.status === 'DELETED') {
        throw new AppError(
          404,
          ERROR_CODES.NOT_FOUND,
          'Comment not found'
        );
      }
      targetUserId = comment.authorId;
    }

    if (reportedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: reportedUserId },
        select: { id: true },
      });
      if (!user) {
        throw new AppError(
          404,
          ERROR_CODES.NOT_FOUND,
          'User not found'
        );
      }
      targetUserId = reportedUserId;
    }

    // Prevent self-report
    if (targetUserId === reporterId) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'You cannot report your own content'
      );
    }

    // Check for duplicate report
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        ...(postId && { postId }),
        ...(commentId && { commentId }),
        status: { in: ['PENDING', 'REVIEWING'] },
      },
    });

    if (existingReport) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'You have already reported this content'
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId,
        postId,
        commentId,
        reportedUserId: targetUserId,
        reason,
        description,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    return report;
  },

  /**
   * Get reports list (admin)
   */
  async getReports(query: ReportQueryInput) {
    const { status, reason, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (reason) {
      where.reason = reason;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              nickname: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              nickname: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              author: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    // Fetch resolver info separately if resolvedBy exists
    const reportsWithResolver = await Promise.all(
      reports.map(async (report) => {
        if (report.resolvedBy) {
          const resolver = await prisma.user.findUnique({
            where: { id: report.resolvedBy },
            select: { id: true, nickname: true },
          });
          return { ...report, resolver };
        }
        return { ...report, resolver: null };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      reports: reportsWithResolver,
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
   * Get report by ID (admin)
   */
  async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            nickname: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            author: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Report not found');
    }

    // Fetch resolver info separately if exists
    let resolver = null;
    if (report.resolvedBy) {
      resolver = await prisma.user.findUnique({
        where: { id: report.resolvedBy },
        select: { id: true, nickname: true },
      });
    }

    return { ...report, resolver };
  },

  /**
   * Resolve a report (admin)
   */
  async resolveReport(id: string, data: ResolveReportInput, resolverId: string) {
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Report not found');
    }

    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'This report has already been processed'
      );
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: data.status,
        resolution: data.resolution,
        resolvedBy: resolverId,
        resolvedAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    return updatedReport;
  },

  /**
   * Hide content (admin action on report)
   */
  async hideContent(reportId: string, resolverId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Report not found');
    }

    // Hide the post or comment
    if (report.postId) {
      await prisma.post.update({
        where: { id: report.postId },
        data: { status: 'HIDDEN' },
      });
    }

    if (report.commentId) {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { status: 'HIDDEN' },
      });
    }

    // Mark report as resolved
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolution: 'Content hidden',
        resolvedBy: resolverId,
        resolvedAt: new Date(),
      },
    });

    return updatedReport;
  },

  /**
   * Delete content (admin action on report)
   */
  async deleteContent(reportId: string, resolverId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Report not found');
    }

    // Delete the post or comment
    if (report.postId) {
      await prisma.post.update({
        where: { id: report.postId },
        data: { status: 'DELETED' },
      });
    }

    if (report.commentId) {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { status: 'DELETED' },
      });
    }

    // Mark report as resolved
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolution: 'Content deleted',
        resolvedBy: resolverId,
        resolvedAt: new Date(),
      },
    });

    return updatedReport;
  },

  /**
   * Get report statistics (admin)
   */
  async getReportStats() {
    const [pending, reviewing, resolved, dismissed] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'REVIEWING' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'DISMISSED' } }),
    ]);

    return {
      pending,
      reviewing,
      resolved,
      dismissed,
      total: pending + reviewing + resolved + dismissed,
    };
  },
};
