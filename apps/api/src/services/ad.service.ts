import { PrismaClient, AdPlacement } from '@prisma/client';

const prisma = new PrismaClient();

export const adService = {
  // Get active ads for a specific placement
  async getActiveAds(placement: string) {
    const now = new Date();

    // Build where clause based on placement
    const placements: AdPlacement[] = [placement as AdPlacement];
    if (placement !== 'ALL') {
      placements.push('ALL' as AdPlacement);
    }

    const ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        placement: { in: placements },
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        placement: true,
      },
    });

    return ads;
  },

  // Record an impression
  async recordImpression(adId: string) {
    await prisma.advertisement.update({
      where: { id: adId },
      data: { impressions: { increment: 1 } },
    });
  },

  // Record a click
  async recordClick(adId: string) {
    await prisma.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });
  },

  // Admin: Get all ads
  async getAllAds(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      prisma.advertisement.findMany({
        skip,
        take: limit,
        orderBy: [
          { isActive: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.advertisement.count(),
    ]);

    return {
      data: ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Admin: Create ad
  async createAd(data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    placement: AdPlacement;
    isActive?: boolean;
    priority?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.advertisement.create({ data });
  },

  // Admin: Update ad
  async updateAd(id: string, data: Partial<{
    title: string;
    imageUrl: string;
    linkUrl: string;
    placement: AdPlacement;
    isActive: boolean;
    priority: number;
    startDate: Date;
    endDate: Date;
  }>) {
    return prisma.advertisement.update({
      where: { id },
      data,
    });
  },

  // Admin: Delete ad
  async deleteAd(id: string) {
    return prisma.advertisement.delete({ where: { id } });
  },

  // Admin: Get ad stats
  async getAdStats(id: string) {
    const ad = await prisma.advertisement.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        impressions: true,
        clicks: true,
        createdAt: true,
      },
    });

    if (!ad) return null;

    const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;

    return {
      ...ad,
      ctr: ctr.toFixed(2) + '%',
    };
  },
};
