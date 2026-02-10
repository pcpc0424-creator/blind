import { Router } from 'express';
import { communityController } from '../controllers/community.controller';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Get user's communities (must be before :slug route)
router.get('/me', authenticate, communityController.getMyCommunities);

// Admin routes (must be before :slug route)
router.get('/admin/list', authenticate, requireAdmin, communityController.adminGetList);
router.get('/admin/stats', authenticate, requireAdmin, communityController.adminGetStats);
router.post('/admin', authenticate, requireAdmin, communityController.adminCreate);
router.patch('/admin/:id', authenticate, requireAdmin, communityController.adminUpdate);
router.delete('/admin/:id', authenticate, requireAdmin, communityController.adminDelete);

// Public routes (with optional auth)
router.get('/', optionalAuth, communityController.getList);
router.get('/:slug', optionalAuth, communityController.getBySlug);

// Protected routes
router.post('/:slug/join', authenticate, communityController.join);
router.post('/:slug/leave', authenticate, communityController.leave);

export default router;
