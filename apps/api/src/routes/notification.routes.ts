import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin routes (must be before :id routes)
router.get('/admin', authenticate, requireAdmin, notificationController.adminGetList);
router.get('/admin/users', authenticate, requireAdmin, notificationController.adminGetUsers);
router.post('/admin/send', authenticate, requireAdmin, notificationController.adminSend);
router.post('/admin/broadcast', authenticate, requireAdmin, notificationController.adminBroadcast);
router.delete('/:id/admin', authenticate, requireAdmin, notificationController.adminDelete);

// User routes
router.get('/', authenticate, notificationController.getList);
router.patch('/read-all', authenticate, notificationController.markAllAsRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.delete('/:id', authenticate, notificationController.delete);

export default router;
