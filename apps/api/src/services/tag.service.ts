import { prisma } from '@blind/database';
import { ERROR_CODES } from '@blind/shared';
import { AppError } from '../middleware/error.middleware';

export const tagService = {
  /**
   * Get all tags (public)
   */
  async getTags(limit: number = 50) {
    const tags = await prisma.tag.findMany({
      orderBy: { postCount: 'desc' },
      take: limit,
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      postCount: t.postCount,
    }));
  },

  /**
   * Get trending tags
   */
  async getTrendingTags(limit: number = 10) {
    const tags = await prisma.tag.findMany({
      where: { postCount: { gte: 1 } },
      orderBy: { postCount: 'desc' },
      take: limit,
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      postCount: t.postCount,
    }));
  },

  // ============== Admin Functions ==============

  /**
   * Get tags for admin
   */
  async getAdminList(params: { search?: string; page: number; limit: number }) {
    const { search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        orderBy: { postCount: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tag.count({ where }),
    ]);

    return {
      data: tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        postCount: t.postCount,
        createdAt: t.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get tag stats for admin
   */
  async getAdminStats() {
    const [total, withPosts] = await Promise.all([
      prisma.tag.count(),
      prisma.tag.count({ where: { postCount: { gte: 1 } } }),
    ]);

    // Get top tags
    const topTags = await prisma.tag.findMany({
      orderBy: { postCount: 'desc' },
      take: 5,
    });

    return {
      total,
      withPosts,
      unused: total - withPosts,
      topTags: topTags.map((t) => ({
        id: t.id,
        name: t.name,
        postCount: t.postCount,
      })),
    };
  },

  /**
   * Create tag (admin)
   */
  async adminCreate(data: { name: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if tag already exists
    const existing = await prisma.tag.findFirst({
      where: {
        OR: [{ name: data.name }, { slug }],
      },
    });

    if (existing) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Tag already exists.');
    }

    return prisma.tag.create({
      data: {
        name: data.name,
        slug,
        postCount: 0,
      },
    });
  },

  /**
   * Update tag (admin)
   */
  async adminUpdate(id: string, data: { name?: string }) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Tag not found.');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    return prisma.tag.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * Delete tag (admin)
   */
  async adminDelete(id: string) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Tag not found.');
    }

    // Delete related post tags first
    await prisma.$transaction([
      prisma.postTag.deleteMany({ where: { tagId: id } }),
      prisma.tag.delete({ where: { id } }),
    ]);

    return { success: true };
  },

  /**
   * Merge tags (admin)
   */
  async adminMerge(sourceId: string, targetId: string) {
    const [source, target] = await Promise.all([
      prisma.tag.findUnique({ where: { id: sourceId } }),
      prisma.tag.findUnique({ where: { id: targetId } }),
    ]);

    if (!source || !target) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Tag not found.');
    }

    // Update all post tags to point to target
    await prisma.$transaction([
      prisma.postTag.updateMany({
        where: { tagId: sourceId },
        data: { tagId: targetId },
      }),
      prisma.tag.update({
        where: { id: targetId },
        data: { postCount: { increment: source.postCount } },
      }),
      prisma.tag.delete({ where: { id: sourceId } }),
    ]);

    return { success: true };
  },
};
