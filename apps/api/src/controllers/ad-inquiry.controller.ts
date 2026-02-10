import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adInquiryService } from '../services/ad-inquiry.service';

const createInquirySchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  contactName: z.string().min(1, 'Contact name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  adType: z.enum(['BANNER', 'SPONSORED', 'NEWSLETTER', 'PARTNERSHIP', 'OTHER']),
  budget: z.string().max(50).optional(),
  duration: z.string().max(50).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

const updateInquirySchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
  adminNote: z.string().max(1000).optional(),
});

export const adInquiryController = {
  /**
   * POST /ad-inquiries
   * Create a new ad inquiry (public)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createInquirySchema.parse(req.body);
      const result = await adInquiryService.createInquiry(input);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /ad-inquiries (admin)
   * Get all inquiries
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;

      const result = await adInquiryService.getInquiries({ status, page, limit });

      res.status(200).json({
        success: true,
        data: result.inquiries,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /ad-inquiries/:id (admin)
   * Get inquiry by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const inquiry = await adInquiryService.getInquiryById(id);

      res.status(200).json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /ad-inquiries/:id (admin)
   * Update inquiry status
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = updateInquirySchema.parse(req.body);
      const result = await adInquiryService.updateInquiry(id, input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /ad-inquiries/:id (admin)
   * Delete inquiry
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adInquiryService.deleteInquiry(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
