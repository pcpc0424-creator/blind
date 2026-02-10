import { Router } from 'express';
import { publicServantController } from '../controllers/public-servant.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes (must be before :slug route)
router.get('/admin/list', authenticate, requireAdmin, publicServantController.adminGetList);
router.get('/admin/stats', authenticate, requireAdmin, publicServantController.adminGetStats);
router.post('/admin', authenticate, requireAdmin, publicServantController.adminCreate);
router.patch('/admin/:id', authenticate, requireAdmin, publicServantController.adminUpdate);
router.delete('/admin/:id', authenticate, requireAdmin, publicServantController.adminDelete);

// Public routes
router.get('/', publicServantController.getList);
router.get('/search', publicServantController.search);
router.get('/:slug', publicServantController.getBySlug);

export default router;
