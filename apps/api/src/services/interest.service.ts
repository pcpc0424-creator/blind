import { prisma, Prisma } from '@blind/database';
import { ERROR_CODES } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

interface InterestQueryInput {
  search?: string;
  page: number;
  limit: number;
  parentId?: string | null; // null = top-level only, undefined = all
}

export const interestService = {
  /**
   * Get list of interest categories (hierarchical)
   */
  async getCategories(query: InterestQueryInput) {
    const { search, page, limit, parentId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InterestCategoryWhereInput = {
      isActive: true,
    };

    // Filter by parent level
    if (parentId === null) {
      // Top-level categories only
      where.parentId = null;
    } else if (parentId) {
      // Specific parent's children
      where.parentId = parentId;
    }
    // If parentId is undefined, get all categories

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.interestCategory.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          iconUrl: true,
          description: true,
          color: true,
          parentId: true,
          _count: {
            select: { communities: true, children: true },
          },
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              iconUrl: true,
              color: true,
            },
            orderBy: { displayOrder: 'asc' },
            take: 5, // Show first 5 subcategories
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.interestCategory.count({ where }),
    ]);

    // Get total member and post counts for each category (including children)
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        // Get all descendant category IDs
        const categoryIds = [cat.id, ...cat.children.map(c => c.id)];

        const stats = await prisma.community.aggregate({
          where: { interestCategoryId: { in: categoryIds } },
          _sum: {
            memberCount: true,
            postCount: true,
          },
        });

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          iconUrl: cat.iconUrl,
          description: cat.description,
          color: cat.color,
          parentId: cat.parentId,
          communityCount: cat._count.communities,
          childCount: cat._count.children,
          children: cat.children,
          totalMembers: stats._sum.memberCount || 0,
          totalPosts: stats._sum.postCount || 0,
        };
      })
    );

    return {
      categories: categoriesWithStats,
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
   * Get interest category by slug with hierarchy
   */
  async getCategoryBySlug(slug: string) {
    const category = await prisma.interestCategory.findUnique({
      where: { slug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            iconUrl: true,
            description: true,
            color: true,
            _count: {
              select: { communities: true },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        communities: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            memberCount: true,
            postCount: true,
            iconUrl: true,
          },
          orderBy: { memberCount: 'desc' },
        },
      },
    });

    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Interest category not found.');
    }

    // Calculate totals including children
    const childCategoryIds = category.children.map(c => c.id);
    const allCategoryIds = [category.id, ...childCategoryIds];

    const allCommunities = await prisma.community.findMany({
      where: { interestCategoryId: { in: allCategoryIds } },
      select: { memberCount: true, postCount: true },
    });

    const totalMembers = allCommunities.reduce((sum, c) => sum + c.memberCount, 0);
    const totalPosts = allCommunities.reduce((sum, c) => sum + c.postCount, 0);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      iconUrl: category.iconUrl,
      description: category.description,
      color: category.color,
      parent: category.parent,
      children: category.children.map(c => ({
        ...c,
        communityCount: c._count.communities,
      })),
      communities: category.communities,
      totalMembers,
      totalPosts,
      communityCount: category.communities.length,
      childCount: category.children.length,
    };
  },

  /**
   * Get hot posts from interest category and its subcategories
   */
  async getHotPosts(categoryId: string, limit: number = 20) {
    // Get all community IDs under this category (including children)
    const category = await prisma.interestCategory.findUnique({
      where: { id: categoryId },
      include: {
        children: { select: { id: true } },
      },
    });

    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Interest category not found.');
    }

    const categoryIds = [category.id, ...category.children.map(c => c.id)];

    const communityIds = await prisma.community.findMany({
      where: { interestCategoryId: { in: categoryIds } },
      select: { id: true },
    });

    const ids = communityIds.map(c => c.id);

    // Get hot posts (high engagement, recent)
    const hotPosts = await prisma.post.findMany({
      where: {
        communityId: { in: ids },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        content: true,
        viewCount: true,
        voteCount: true,
        commentCount: true,
        createdAt: true,
        isAnonymous: true,
        author: {
          select: {
            nickname: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { voteCount: 'desc' },
        { commentCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return hotPosts.map(post => ({
      id: post.id,
      title: post.title,
      preview: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
      viewCount: post.viewCount,
      voteCount: post.voteCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      authorNickname: post.isAnonymous ? 'Anonymous' : post.author.nickname,
      community: post.community,
    }));
  },

  /**
   * Search interest categories
   */
  async searchCategories(query: string, limit: number = 10) {
    const categories = await prisma.interestCategory.findMany({
      where: {
        isActive: true,
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
        color: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: limit,
    });

    return categories;
  },

  // ============== Admin Functions ==============

  /**
   * Get categories for admin (all, including inactive)
   */
  async getAdminList() {
    const categories = await prisma.interestCategory.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        description: true,
        color: true,
        isActive: true,
        displayOrder: true,
        _count: {
          select: { communities: true },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            iconUrl: true,
            color: true,
            isActive: true,
            displayOrder: true,
            _count: {
              select: { communities: true },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories.map((c) => ({
      ...c,
      communityCount: c._count.communities,
      children: c.children.map((child) => ({
        ...child,
        communityCount: child._count.communities,
      })),
    }));
  },

  /**
   * Get stats for admin
   */
  async getAdminStats() {
    const [total, topLevel, children, totalCommunities] = await Promise.all([
      prisma.interestCategory.count(),
      prisma.interestCategory.count({ where: { parentId: null } }),
      prisma.interestCategory.count({ where: { NOT: { parentId: null } } }),
      prisma.community.count({ where: { NOT: { interestCategoryId: null } } }),
    ]);

    return { total, topLevel, children, totalCommunities };
  },

  /**
   * Create category (admin)
   */
  async adminCreate(data: {
    name: string;
    slug: string;
    parentId?: string;
    description?: string;
    color?: string;
    iconUrl?: string;
  }) {
    // Check if slug already exists
    const existing = await prisma.interestCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Slug already exists.');
    }

    // Get max display order
    const maxOrder = await prisma.interestCategory.aggregate({
      where: { parentId: data.parentId || null },
      _max: { displayOrder: true },
    });

    return prisma.interestCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId || null,
        description: data.description,
        color: data.color || '#6366F1',
        iconUrl: data.iconUrl,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
        isActive: true,
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
    color?: string;
    iconUrl?: string;
    isActive?: boolean;
    displayOrder?: number;
  }) {
    const category = await prisma.interestCategory.findUnique({ where: { id } });
    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Category not found.');
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.interestCategory.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Slug already exists.');
      }
    }

    return prisma.interestCategory.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete category (admin)
   */
  async adminDelete(id: string) {
    const category = await prisma.interestCategory.findUnique({
      where: { id },
      include: { _count: { select: { communities: true, children: true } } },
    });

    if (!category) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Category not found.');
    }

    if (category._count.communities > 0) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Cannot delete category with communities.');
    }

    if (category._count.children > 0) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Cannot delete category with children.');
    }

    await prisma.interestCategory.delete({ where: { id } });
    return { success: true };
  },

  /**
   * Reorder categories (admin)
   */
  async adminReorder(items: { id: string; displayOrder: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.interestCategory.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );
    return { success: true };
  },
};
