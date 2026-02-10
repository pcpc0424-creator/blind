import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.get('/admin', authenticate, requireAdmin, userController.adminGetList);
router.get('/admin/stats', authenticate, requireAdmin, userController.adminGetStats);
router.get('/admin/:id', authenticate, requireAdmin, userController.adminGetById);
router.patch('/admin/:id/role', authenticate, requireAdmin, userController.adminUpdateRole);
router.patch('/admin/:id/status', authenticate, requireAdmin, userController.adminUpdateStatus);
router.post('/admin/:id/suspend', authenticate, requireAdmin, userController.adminSuspend);
router.post('/admin/:id/activate', authenticate, requireAdmin, userController.adminActivate);

export default router;
