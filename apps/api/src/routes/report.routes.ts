import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// User routes
router.post('/', authenticate, reportController.create);

// Admin routes
router.get('/', authenticate, requireAdmin, reportController.getList);
router.get('/stats', authenticate, requireAdmin, reportController.getStats);
router.get('/:id', authenticate, requireAdmin, reportController.getById);
router.patch('/:id/resolve', authenticate, requireAdmin, reportController.resolve);
router.post('/:id/hide', authenticate, requireAdmin, reportController.hideContent);
router.post('/:id/delete', authenticate, requireAdmin, reportController.deleteContent);

export default router;
