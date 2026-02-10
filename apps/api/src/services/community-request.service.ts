import { prisma, Prisma } from '@blind/database';
import { ERROR_CODES } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

interface CreateRequestInput {
  userId: string;
  name: string;
  description?: string;
  targetType: 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';
  companyId?: string;
  publicServantCategoryId?: string;
  interestCategoryId?: string;
}

interface ReviewRequestInput {
  requestId: string;
  reviewerId: string;
  status: 'APPROVED' | 'REJECTED';
  adminNote?: string;
}

export const communityRequestService = {
  /**
   * Create a new community request
   */
  async createRequest(input: CreateRequestInput) {
    const { userId, name, description, targetType, companyId, publicServantCategoryId, interestCategoryId } = input;

    // Validate target organization exists
    if (targetType === 'COMPANY' && companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Company not found.');
      }
    }

    if (targetType === 'PUBLIC_SERVANT' && publicServantCategoryId) {
      const category = await prisma.publicServantCategory.findUnique({
        where: { id: publicServantCategoryId },
      });
      if (!category) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Public servant category not found.');
      }
    }

    if (targetType === 'INTEREST' && interestCategoryId) {
      const category = await prisma.interestCategory.findUnique({
        where: { id: interestCategoryId },
      });
      if (!category) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Interest category not found.');
      }
    }

    // Check for duplicate pending requests
    const existingRequest = await prisma.communityRequest.findFirst({
      where: {
        userId,
        name: { equals: name, mode: 'insensitive' },
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'A request with the same name is already pending.');
    }

    const request = await prisma.communityRequest.create({
      data: {
        userId,
        name,
        description,
        targetType,
        companyId: targetType === 'COMPANY' ? companyId : null,
        publicServantCategoryId: targetType === 'PUBLIC_SERVANT' ? publicServantCategoryId : null,
        interestCategoryId: targetType === 'INTEREST' ? interestCategoryId : null,
      },
      include: {
        user: { select: { id: true, nickname: true } },
        company: { select: { id: true, name: true, slug: true } },
        publicServantCategory: { select: { id: true, name: true, slug: true } },
        interestCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    return request;
  },

  /**
   * Get user's requests
   */
  async getUserRequests(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.communityRequest.findMany({
        where: { userId },
        include: {
          company: { select: { id: true, name: true, slug: true } },
          publicServantCategory: { select: { id: true, name: true, slug: true } },
          interestCategory: { select: { id: true, name: true, slug: true } },
          createdCommunity: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.communityRequest.count({ where: { userId } }),
    ]);

    return {
      requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all requests for admin
   */
  async getAdminRequests(
    query: {
      status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
      targetType?: 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';
      page: number;
      limit: number;
    }
  ) {
    const { status, targetType, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityRequestWhereInput = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

    const [requests, total] = await Promise.all([
      prisma.communityRequest.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true } },
          company: { select: { id: true, name: true, slug: true } },
          publicServantCategory: { select: { id: true, name: true, slug: true } },
          interestCategory: { select: { id: true, name: true, slug: true } },
          createdCommunity: { select: { id: true, name: true, slug: true } },
          reviewer: { select: { id: true, nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.communityRequest.count({ where }),
    ]);

    return {
      requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Review (approve/reject) a request
   */
  async reviewRequest(input: ReviewRequestInput) {
    const { requestId, reviewerId, status, adminNote } = input;

    const request = await prisma.communityRequest.findUnique({
      where: { id: requestId },
      include: {
        company: true,
        publicServantCategory: true,
        interestCategory: true,
      },
    });

    if (!request) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Request not found.');
    }

    if (request.status !== 'PENDING') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'This request has already been processed.');
    }

    // If approved, create the community
    let createdCommunityId: string | null = null;

    if (status === 'APPROVED') {
      // Generate slug from name
      const slug = request.name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-|-$/g, '');

      // Determine community type
      let communityType: 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';
      switch (request.targetType) {
        case 'COMPANY':
          communityType = 'COMPANY';
          break;
        case 'PUBLIC_SERVANT':
          communityType = 'PUBLIC_SERVANT';
          break;
        case 'INTEREST':
          communityType = 'INTEREST';
          break;
        default:
          communityType = 'GENERAL';
      }

      // Check if slug already exists
      const existingCommunity = await prisma.community.findUnique({
        where: { slug },
      });

      if (existingCommunity) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'A community with the same name already exists.');
      }

      const community = await prisma.community.create({
        data: {
          name: request.name,
          slug,
          description: request.description,
          type: communityType,
          companyId: request.companyId,
          publicServantCategoryId: request.publicServantCategoryId,
          interestCategoryId: request.interestCategoryId,
        },
      });

      createdCommunityId = community.id;
    }

    // Update the request
    const updatedRequest = await prisma.communityRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNote,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        createdCommunityId,
      },
      include: {
        user: { select: { id: true, nickname: true } },
        company: { select: { id: true, name: true, slug: true } },
        publicServantCategory: { select: { id: true, name: true, slug: true } },
        interestCategory: { select: { id: true, name: true, slug: true } },
        createdCommunity: { select: { id: true, name: true, slug: true } },
        reviewer: { select: { id: true, nickname: true } },
      },
    });

    return updatedRequest;
  },

  /**
   * Cancel a request (by user)
   */
  async cancelRequest(requestId: string, userId: string) {
    const request = await prisma.communityRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Request not found.');
    }

    if (request.userId !== userId) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'You can only cancel your own requests.');
    }

    if (request.status !== 'PENDING') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Only pending requests can be cancelled.');
    }

    const updatedRequest = await prisma.communityRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return updatedRequest;
  },
};
