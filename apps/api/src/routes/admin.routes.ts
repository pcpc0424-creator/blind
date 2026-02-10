import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '@blind/database';

const router = Router();

// Dashboard stats
router.get('/dashboard/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get all stats in parallel
    const [
      totalUsers,
      todayUsers,
      weekUsers,
      totalCompanies,
      verifiedCompanies,
      totalCommunities,
      pendingCommunityRequests,
      totalPosts,
      todayPosts,
      pendingReports,
      recentUsers,
      recentCommunityRequests,
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),

      // Company stats
      prisma.company.count(),
      prisma.company.count({ where: { isVerified: true } }),

      // Community stats
      prisma.community.count(),
      prisma.communityRequest.count({ where: { status: 'PENDING' } }),

      // Post stats
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: todayStart } } }),

      // Report stats
      prisma.report.count({ where: { status: 'PENDING' } }),

      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nickname: true,
          createdAt: true,
          company: { select: { name: true } },
        },
      }),

      // Recent community requests (last 5)
      prisma.communityRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          targetType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          today: todayUsers,
          thisWeek: weekUsers,
        },
        companies: {
          total: totalCompanies,
          verified: verifiedCompanies,
        },
        communities: {
          total: totalCommunities,
          pending: pendingCommunityRequests,
        },
        posts: {
          total: totalPosts,
          today: todayPosts,
        },
        reports: {
          pending: pendingReports,
        },
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          nickname: user.nickname,
          company: user.company?.name || null,
          createdAt: user.createdAt,
        })),
        recentCommunityRequests: recentCommunityRequests.map(req => ({
          id: req.id,
          name: req.name,
          type: req.targetType,
          status: req.status.toLowerCase(),
          createdAt: req.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard stats' },
    });
  }
});

export default router;
