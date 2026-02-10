import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes (must be before :id route)
router.get('/admin/list', authenticate, requireAdmin, postController.adminGetList);
router.get('/admin/stats', authenticate, requireAdmin, postController.adminGetStats);
router.patch('/admin/:id/status', authenticate, requireAdmin, postController.adminUpdateStatus);
router.post('/admin/:id/pin', authenticate, requireAdmin, postController.adminTogglePin);
router.delete('/admin/:id', authenticate, requireAdmin, postController.adminDelete);

// Public routes (with optional auth for vote/bookmark status)
router.get('/', optionalAuth, postController.getList);
router.get('/trending', optionalAuth, postController.getTrending);
router.get('/bookmarks', authenticate, postController.getBookmarks);
router.get('/:id', optionalAuth, postController.getById);

// Protected routes
router.post('/', authenticate, postController.create);
router.patch('/:id', authenticate, postController.update);
router.delete('/:id', authenticate, postController.delete);
router.post('/:id/vote', authenticate, postController.vote);
router.post('/:id/bookmark', authenticate, postController.bookmark);

export default router;
