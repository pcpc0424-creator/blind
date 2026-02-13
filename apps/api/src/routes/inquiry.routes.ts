import { Router } from 'express';
import { inquiryController } from '../controllers/inquiry.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// User routes
router.post('/', authenticate, inquiryController.create);
router.get('/my', authenticate, inquiryController.getMyInquiries);
router.get('/my/:id', authenticate, inquiryController.getMyInquiryById);

// Admin routes
router.get('/', authenticate, requireAdmin, inquiryController.getList);
router.get('/stats', authenticate, requireAdmin, inquiryController.getStats);
router.get('/:id', authenticate, requireAdmin, inquiryController.getById);
router.post('/:id/reply', authenticate, requireAdmin, inquiryController.reply);
router.patch('/:id/status', authenticate, requireAdmin, inquiryController.updateStatus);
router.delete('/:id', authenticate, requireAdmin, inquiryController.delete);

export default router;
