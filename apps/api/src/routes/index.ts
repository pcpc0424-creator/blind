import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import communityRoutes from './community.routes';
import postRoutes from './post.routes';
import commentRoutes, { postCommentRoutes } from './comment.routes';
import companyRoutes from './company.routes';
import publicServantRoutes from './public-servant.routes';
import interestRoutes from './interest.routes';
import communityRequestRoutes from './community-request.routes';
import reportRoutes from './report.routes';
import adRoutes from './ad.routes';
import adInquiryRoutes from './ad-inquiry.routes';
import notificationRoutes from './notification.routes';
import tagRoutes from './tag.routes';
import settingsRoutes from './settings.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import reviewRoutes from './review.routes';

const router = Router();

// Mount routes
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/communities', communityRoutes);
router.use('/community-requests', communityRequestRoutes);
router.use('/posts', postRoutes);
router.use('/posts/:postId/comments', postCommentRoutes);
router.use('/comments', commentRoutes);
router.use('/companies', companyRoutes);
router.use('/public-servants', publicServantRoutes);
router.use('/interests', interestRoutes);
router.use('/reports', reportRoutes);
router.use('/ads', adRoutes);
router.use('/ad-inquiries', adInquiryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tags', tagRoutes);
router.use('/settings', settingsRoutes);
router.use('/reviews', reviewRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Blind Platform API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        communities: '/api/v1/communities',
        communityRequests: '/api/v1/community-requests',
        posts: '/api/v1/posts',
        comments: '/api/v1/comments',
        companies: '/api/v1/companies',
        publicServants: '/api/v1/public-servants',
        interests: '/api/v1/interests',
        reports: '/api/v1/reports',
        ads: '/api/v1/ads',
        adInquiries: '/api/v1/ad-inquiries',
        notifications: '/api/v1/notifications',
        tags: '/api/v1/tags',
        settings: '/api/v1/settings',
      },
    },
  });
});

export default router;
