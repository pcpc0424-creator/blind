import { Router } from 'express';
import { adInquiryController } from '../controllers/ad-inquiry.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public route - anyone can submit an inquiry
router.post('/', adInquiryController.create);

// Admin routes
router.get('/', authenticate, requireRole('ADMIN'), adInquiryController.getList);
router.get('/:id', authenticate, requireRole('ADMIN'), adInquiryController.getById);
router.patch('/:id', authenticate, requireRole('ADMIN'), adInquiryController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), adInquiryController.delete);

export default router;
