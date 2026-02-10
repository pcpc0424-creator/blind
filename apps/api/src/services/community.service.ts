import { prisma, CommunityType } from '@blind/database';
import { ERROR_CODES, CommunityQueryInput } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

export const communityService = {
  /**
   * Get list of communities
   */
  async getCommunities(
    query: CommunityQueryInput,
    userId?: string,
    userCompanyId?: string | null
  ) {
    const { type, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              isVerified: true,
            },
          },
          _count: {
            select: { members: true, posts: true },
          },
        },
        orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.community.count({ where }),
    ]);

    // Check membership status if user is authenticated
    let membershipMap: Record<string, boolean> = {};
    if (userId) {
      const memberships = await prisma.communityMember.findMany({
        where: {
          userId,
          communityId: { in: communities.map((c) => c.id) },
        },
        select: { communityId: true },
      });
      membershipMap = Object.fromEntries(
        memberships.map((m) => [m.communityId, true])
      );
    }

    return {
      communities: communities.map((c) => {
        // Check access for company communities
        const canAccess = c.type !== 'COMPANY' || !c.companyId || c.companyId === userCompanyId;

        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          type: c.type,
          iconUrl: c.iconUrl,
          bannerUrl: c.bannerUrl,
          isPrivate: c.isPrivate,
          memberCount: c.memberCount,
          postCount: c.postCount,
          company: c.company,
          isMember: membershipMap[c.id] || false,
          canAccess,
        };
      }),
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
   * Get community by slug
   */
  async getCommunityBySlug(slug: string, userId?: string, userCompanyId?: string | null, isAdmin?: boolean) {
    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (!community) {
      throw new AppError(404, ERROR_CODES.COMMUNITY_NOT_FOUND, 'Community not found.');
    }

    // Check access for company communities (admin can access all)
    if (community.type === 'COMPANY' && community.companyId && !isAdmin) {
      if (!userCompanyId || community.companyId !== userCompanyId) {
        throw new AppError(
          403,
          ERROR_CODES.COMPANY_VERIFICATION_REQUIRED,
          'Only verified employees can access this company community.'
        );
      }
    }

    let isMember = false;
    if (userId) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId,
          },
        },
      });
      isMember = !!membership;

      // Auto-join company community for verified employees
      if (!isMember && community.type === 'COMPANY' && community.companyId && userCompanyId === community.companyId) {
        await prisma.$transaction([
          prisma.communityMember.create({
            data: {
              communityId: community.id,
              userId,
              role: 'MEMBER',
            },
          }),
          prisma.community.update({
            where: { id: community.id },
            data: { memberCount: { increment: 1 } },
          }),
        ]);
        isMember = true;
      }
    }

    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      type: community.type,
      iconUrl: community.iconUrl,
      bannerUrl: community.bannerUrl,
      isPrivate: community.isPrivate,
      memberCount: community.memberCount,
      postCount: community.postCount,
      company: community.company,
      isMember,
    };
  },

  /**
   * Join a community
   */
  async joinCommunity(communityId: string, userId: string, userCompanyId: string | null) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new AppError(404, ERROR_CODES.COMMUNITY_NOT_FOUND, 'Community not found.');
    }

    // Check if already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId },
      },
    });

    if (existingMembership) {
      throw new AppError(400, ERROR_CODES.ALREADY_COMMUNITY_MEMBER, 'Already a member of this community.');
    }

    // For company communities, verify company membership
    if (community.type === 'COMPANY' && community.companyId) {
      if (!userCompanyId || community.companyId !== userCompanyId) {
        throw new AppError(
          403,
          ERROR_CODES.COMPANY_VERIFICATION_REQUIRED,
          'Only verified employees can join this company community.'
        );
      }
    }

    // Create membership
    await prisma.$transaction([
      prisma.communityMember.create({
        data: {
          communityId,
          userId,
        },
      }),
      prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return { message: 'You have joined the community.' };
  },

  /**
   * Leave a community
   */
  async leaveCommunity(communityId: string, userId: string) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId },
      },
    });

    if (!membership) {
      throw new AppError(400, ERROR_CODES.NOT_COMMUNITY_MEMBER, 'You are not a member of this community.');
    }

    await prisma.$transaction([
      prisma.communityMember.delete({
        where: { id: membership.id },
      }),
      prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'You have left the community.' };
  },

  /**
   * Get user's joined communities
   */
  async getUserCommunities(userId: string) {
    const memberships = await prisma.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.community.id,
      name: m.community.name,
      slug: m.community.slug,
      description: m.community.description,
      type: m.community.type,
      iconUrl: m.community.iconUrl,
      isPrivate: m.community.isPrivate,
      memberCount: m.community.memberCount,
      postCount: m.community.postCount,
      company: m.community.company,
      joinedAt: m.joinedAt.toISOString(),
    }));
  },

  // ============== Admin Functions ==============

  /**
   * Get communities for admin
   */
  async getAdminList(params: { search?: string; type?: string; page: number; limit: number }) {
    const { search, type, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          type: true,
          isPrivate: true,
          memberCount: true,
          postCount: true,
          createdAt: true,
          company: {
            select: { id: true, name: true },
          },
          publicServantCategory: {
            select: { id: true, name: true },
          },
          interestCategory: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.community.count({ where }),
    ]);

    return {
      data: communities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get community stats for admin
   */
  async getAdminStats() {
    const [total, general, company, publicServant, interest, privateCommunities] = await Promise.all([
      prisma.community.count(),
      prisma.community.count({ where: { type: 'GENERAL' } }),
      prisma.community.count({ where: { type: 'COMPANY' } }),
      prisma.community.count({ where: { type: 'PUBLIC_SERVANT' } }),
      prisma.community.count({ where: { type: 'INTEREST' } }),
      prisma.community.count({ where: { isPrivate: true } }),
    ]);

    return { total, general, company, publicServant, interest, private: privateCommunities };
  },

  /**
   * Create community (admin)
   */
  async adminCreate(data: {
    name: string;
    description?: string;
    type: string;
    isPrivate?: boolean;
  }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '');

    return prisma.community.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        type: data.type as CommunityType,
        isPrivate: data.isPrivate || false,
      },
    });
  },

  /**
   * Update community (admin)
   */
  async adminUpdate(id: string, data: {
    name?: string;
    description?: string;
    type?: string;
    isPrivate?: boolean;
  }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

    return prisma.community.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * Delete community (admin)
   */
  async adminDelete(id: string) {
    // Delete related data first
    await prisma.$transaction([
      prisma.communityMember.deleteMany({ where: { communityId: id } }),
      prisma.post.deleteMany({ where: { communityId: id } }),
      prisma.community.delete({ where: { id } }),
    ]);

    return { success: true };
  },
};
