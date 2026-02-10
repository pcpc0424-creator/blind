import { Router } from 'express';
import { adController } from '../controllers/ad.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', adController.getAds);
router.post('/:id/impression', adController.recordImpression);
router.post('/:id/click', adController.recordClick);

// Admin routes
router.get('/admin/list', authenticate, requireAdmin, adController.getAllAds);
router.post('/admin', authenticate, requireAdmin, adController.createAd);
router.patch('/admin/:id', authenticate, requireAdmin, adController.updateAd);
router.delete('/admin/:id', authenticate, requireAdmin, adController.deleteAd);
router.get('/admin/:id/stats', authenticate, requireAdmin, adController.getAdStats);

export default router;
