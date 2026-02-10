import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All settings routes require admin
router.get('/admin', authenticate, requireAdmin, settingsController.getAll);
router.get('/admin/category/:category', authenticate, requireAdmin, settingsController.getByCategory);
router.get('/admin/key/:key', authenticate, requireAdmin, settingsController.getByKey);
router.patch('/admin', authenticate, requireAdmin, settingsController.updateAll);
router.patch('/admin/key/:key', authenticate, requireAdmin, settingsController.updateByKey);
router.post('/admin/initialize', authenticate, requireAdmin, settingsController.initialize);

export default router;
