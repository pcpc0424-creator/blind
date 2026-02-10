import { Router } from 'express';
import { companyController } from '../controllers/company.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', companyController.getList);
router.get('/search', companyController.search);
router.get('/featured', companyController.getFeatured);

// Admin routes (require authentication + admin role) - must be before :slug
router.get('/admin/list', authenticate, requireAdmin, companyController.getForAdmin);
router.get('/admin/stats', authenticate, requireAdmin, companyController.getAdminStats);
router.post('/admin', authenticate, requireAdmin, companyController.adminCreate);
router.post('/admin/import', authenticate, requireAdmin, companyController.bulkImport);
router.post('/admin/display-order', authenticate, requireAdmin, companyController.bulkUpdateDisplayOrder);
router.patch('/admin/:id', authenticate, requireAdmin, companyController.adminUpdate);
router.patch('/admin/:id/display', authenticate, requireAdmin, companyController.updateDisplaySettings);
router.delete('/admin/:id', authenticate, requireAdmin, companyController.adminDelete);

// Domain management routes
router.get('/admin/:id/domains', authenticate, requireAdmin, companyController.getDomains);
router.post('/admin/:id/domains', authenticate, requireAdmin, companyController.addDomain);
router.patch('/admin/domains/:domainId', authenticate, requireAdmin, companyController.updateDomain);
router.delete('/admin/domains/:domainId', authenticate, requireAdmin, companyController.deleteDomain);

// Slug route - must be after admin routes
router.get('/:slug', companyController.getBySlug);

export default router;
