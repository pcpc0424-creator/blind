import { Request, Response, NextFunction } from 'express';
import { companyQuerySchema } from '@blind/shared';
import { companyService } from '../services/company.service';
import { AppError } from '../middleware/error.middleware';

export const companyController = {
  /**
   * GET /companies
   * Get list of companies
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = companyQuerySchema.parse(req.query);
      const result = await companyService.getCompanies(query);

      res.status(200).json({
        success: true,
        data: result.companies,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /companies/search
   * Search companies for autocomplete
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const companies = await companyService.searchCompanies(query, limit);

      res.status(200).json({
        success: true,
        data: companies,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /companies/:slug
   * Get company by slug
   */
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const company = await companyService.getCompanyBySlug(slug);

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /companies/featured
   * Get featured companies for homepage
   */
  async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const companies = await companyService.getFeaturedCompanies(limit);

      res.status(200).json({
        success: true,
        data: companies,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /admin/companies/import
   * Bulk import companies from CSV data (admin only)
   */
  async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      // Check admin permission
      if (req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Admin access required');
      }

      const { companies } = req.body;

      if (!Array.isArray(companies) || companies.length === 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Companies array is required');
      }

      const result = await companyService.bulkImportCompanies(companies);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /admin/companies/:id/display
   * Update company display settings (admin only)
   */
  async updateDisplaySettings(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Admin access required');
      }

      const { id } = req.params;
      const { displayOrder, isPinned, isSponsored, isActive } = req.body;

      const company = await companyService.updateCompanyDisplaySettings(id, {
        displayOrder,
        isPinned,
        isSponsored,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /admin/companies/display-order
   * Bulk update display order (admin only)
   */
  async bulkUpdateDisplayOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Admin access required');
      }

      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Updates array is required');
      }

      const result = await companyService.bulkUpdateDisplayOrder(updates);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/companies
   * Get all companies for admin management
   */
  async getForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Admin access required');
      }

      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await companyService.getCompaniesForAdmin({ search, page, limit });

      res.status(200).json({
        success: true,
        data: result.companies,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /companies/admin/stats
   * Get company stats for admin
   */
  async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await companyService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /companies/admin
   * Create company (admin)
   */
  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.createCompany(req.body);
      res.status(201).json({ success: true, data: company });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /companies/admin/:id
   * Update company (admin)
   */
  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const company = await companyService.updateCompany(id, req.body);
      res.json({ success: true, data: company });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /companies/admin/:id
   * Delete company (admin)
   */
  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await companyService.deleteCompany(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /companies/admin/:id/domains
   * Get company domains (admin)
   */
  async getDomains(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const domains = await companyService.getCompanyDomains(id);
      res.json({ success: true, data: domains });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /companies/admin/:id/domains
   * Add domain to company (admin)
   */
  async addDomain(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { domain, isPrimary } = req.body;

      if (!domain || typeof domain !== 'string') {
        throw new AppError(400, 'VALIDATION_ERROR', 'Domain is required');
      }

      const newDomain = await companyService.addCompanyDomain(id, domain, isPrimary || false);
      res.status(201).json({ success: true, data: newDomain });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /companies/admin/domains/:domainId
   * Update domain (admin)
   */
  async updateDomain(req: Request, res: Response, next: NextFunction) {
    try {
      const { domainId } = req.params;
      const { isPrimary } = req.body;

      const domain = await companyService.updateCompanyDomain(domainId, isPrimary);
      res.json({ success: true, data: domain });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /companies/admin/domains/:domainId
   * Delete domain (admin)
   */
  async deleteDomain(req: Request, res: Response, next: NextFunction) {
    try {
      const { domainId } = req.params;
      await companyService.deleteCompanyDomain(domainId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
