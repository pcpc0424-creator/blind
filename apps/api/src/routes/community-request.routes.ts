import { Router } from 'express';
import { communityRequestController } from '../controllers/community-request.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', communityRequestController.create);
router.get('/my', communityRequestController.getMyRequests);
router.delete('/:id', communityRequestController.cancel);

// Admin routes
router.get('/admin', communityRequestController.getAdminList);
router.post('/:id/review', communityRequestController.review);

export default router;
