import { Router } from 'express';
import { interestController } from '../controllers/interest.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes (must be before :slug route)
router.get('/admin/list', authenticate, requireAdmin, interestController.adminGetList);
router.get('/admin/stats', authenticate, requireAdmin, interestController.adminGetStats);
router.post('/admin', authenticate, requireAdmin, interestController.adminCreate);
router.patch('/admin/:id', authenticate, requireAdmin, interestController.adminUpdate);
router.delete('/admin/:id', authenticate, requireAdmin, interestController.adminDelete);
router.post('/admin/reorder', authenticate, requireAdmin, interestController.adminReorder);

// Public routes
router.get('/', interestController.getList);
router.get('/search', interestController.search);
router.get('/:slug', interestController.getBySlug);
router.get('/:slug/hot-posts', interestController.getHotPosts);

export default router;
