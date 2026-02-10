import { prisma, Prisma } from '@blind/database';
import { ERROR_CODES } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

interface PublicServantQueryInput {
  search?: string;
  page: number;
  limit: number;
}

export const publicServantService = {
  /**
   * Get list of public servant categories
   */
  async getCategories(query: PublicServantQueryInput) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PublicServantCategoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.publicServantCategory.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          iconUrl: true,
          description: true,
          avgRating: true,
          totalReviews: true,
          _count: {
            select: { communities: true },
          },
        },
        orderBy: [{ totalReviews: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.publicServantCategory.count({ where }),
    ]);

    return {
      categories: categories.map((cat) => ({
        ...cat,
        communityCount: cat._count.communities,
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
   * Get public servant category by slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await prisma.publicServantCategory.findUnique({
      where: { slug },
      include: {
        communities: {
          select: {
            id: true,
            name: true,
            slug: true,
            memberCount: true,
            postCount: true,
          },
        },
        reviews: {
          where: { status: 'APPROVED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            overallRating: true,
            pros: true,
            cons: true,
            position: true,
            createdAt: true,
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Category not found.');
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      iconUrl: category.iconUrl,
      description: category.description,
      avgRating: category.avgRating,
      totalReviews: category.totalReviews,
      avgWorkLife: category.avgWorkLife,
      avgSalary: category.avgSalary,
      avgStability: category.avgStability,
      avgGrowth: category.avgGrowth,
      communities: category.communities,
      recentReviews: category.reviews,
    };
  },

  /**
   * Search public servant categories
   */
  async searchCategories(query: string, limit: number = 10) {
    const categories = await prisma.publicServantCategory.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
      },
      orderBy: { totalReviews: 'desc' },
      take: limit,
    });

    return categories;
  },

  // ============== Admin Functions ==============

  /**
   * Get categories for admin
   */
  async getAdminList() {
    const categories = await prisma.publicServantCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        description: true,
        avgRating: true,
        totalReviews: true,
        _count: {
          select: { communities: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      ...c,
      communityCount: c._count.communities,
    }));
  },

  /**
   * Get stats for admin
   */
  async getAdminStats() {
    const [total, withCommunities, totalCommunities] = await Promise.all([
      prisma.publicServantCategory.count(),
      prisma.publicServantCategory.count({
        where: { communities: { some: {} } },
      }),
      prisma.community.count({ where: { NOT: { publicServantCategoryId: null } } }),
    ]);

    return { total, withCommunities, totalCommunities };
  },

  /**
   * Create category (admin)
   */
  async adminCreate(data: {
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
  }) {
    // Check if slug already exists
    const existing = await prisma.publicServantCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Slug already exists.');
    }

    return prisma.publicServantCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        iconUrl: data.iconUrl,
      },
    });
  },

  /**
   * Update category (admin)
   */
  async adminUpdate(id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    iconUrl?: string;
  }) {
    const category = await prisma.publicServantCategory.findUnique({ where: { id } });
    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Category not found.');
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.publicServantCategory.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Slug already exists.');
      }
    }

    return prisma.publicServantCategory.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete category (admin)
   */
  async adminDelete(id: string) {
    const category = await prisma.publicServantCategory.findUnique({
      where: { id },
      include: { _count: { select: { communities: true } } },
    });

    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Category not found.');
    }

    if (category._count.communities > 0) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Cannot delete category with communities.');
    }

    await prisma.publicServantCategory.delete({ where: { id } });
    return { success: true };
  },
};
