import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes (must be before :id routes)
router.get('/admin', authenticate, requireAdmin, commentController.adminGetList);
router.patch('/:id/toggle-hide', authenticate, requireAdmin, commentController.adminToggleHide);
router.delete('/:id/admin', authenticate, requireAdmin, commentController.adminDelete);

// Comment operations (mounted under /comments)
router.patch('/:id', authenticate, commentController.update);
router.delete('/:id', authenticate, commentController.delete);
router.post('/:id/vote', authenticate, commentController.vote);

export default router;

// Export post comment routes separately for nested mounting
export const postCommentRoutes = Router({ mergeParams: true });
postCommentRoutes.get('/', optionalAuth, commentController.getList);
postCommentRoutes.post('/', authenticate, commentController.create);
