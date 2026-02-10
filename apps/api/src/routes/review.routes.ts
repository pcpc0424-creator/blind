import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// ============== Company Reviews ==============
// GET /reviews/company/:companyId - Get reviews for a company
router.get('/company/:companyId', reviewController.getCompanyReviews);

// POST /reviews/company/:companyId - Create a review for a company
router.post('/company/:companyId', authenticate, reviewController.createCompanyReview);

// DELETE /reviews/company/:reviewId - Delete a company review
router.delete('/company/:reviewId', authenticate, reviewController.deleteCompanyReview);

// ============== Public Servant Reviews ==============
// GET /reviews/public-servant/:categoryId - Get reviews for a category
router.get('/public-servant/:categoryId', reviewController.getPublicServantReviews);

// POST /reviews/public-servant/:categoryId - Create a review for a category
router.post('/public-servant/:categoryId', authenticate, reviewController.createPublicServantReview);

// DELETE /reviews/public-servant/:reviewId - Delete a public servant review
router.delete('/public-servant/:reviewId', authenticate, reviewController.deletePublicServantReview);

// ============== Admin Routes ==============
// GET /reviews/admin/:type - Get all reviews (admin)
router.get('/admin/:type', authenticate, requireAdmin, reviewController.adminGetReviews);

// PATCH /reviews/admin/:type/:reviewId - Update review status (admin)
router.patch('/admin/:type/:reviewId', authenticate, requireAdmin, reviewController.adminUpdateStatus);

export default router;
