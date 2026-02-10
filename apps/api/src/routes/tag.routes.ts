import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes (must be before other routes)
router.get('/admin/list', authenticate, requireAdmin, tagController.adminGetList);
router.get('/admin/stats', authenticate, requireAdmin, tagController.adminGetStats);
router.post('/admin', authenticate, requireAdmin, tagController.adminCreate);
router.patch('/admin/:id', authenticate, requireAdmin, tagController.adminUpdate);
router.delete('/admin/:id', authenticate, requireAdmin, tagController.adminDelete);
router.post('/admin/merge', authenticate, requireAdmin, tagController.adminMerge);

// Public routes
router.get('/', tagController.getList);
router.get('/trending', tagController.getTrending);

export default router;
