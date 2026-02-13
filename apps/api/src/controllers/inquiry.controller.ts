import { Request, Response, NextFunction } from 'express';
import {
  createInquirySchema,
  inquiryQuerySchema,
  replyInquirySchema,
  updateInquiryStatusSchema,
} from '@blind/shared';
import { inquiryService } from '../services/inquiry.service';

export const inquiryController = {
  /**
   * POST /inquiries
   * Create a new inquiry (user)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('[INQUIRY] Create request received');
      console.log('[INQUIRY] User:', req.user?.id);
      console.log('[INQUIRY] Body:', req.body);
      const data = createInquirySchema.parse(req.body);
      console.log('[INQUIRY] Parsed data:', data);
      const inquiry = await inquiryService.createInquiry(data, req.user!.id);
      console.log('[INQUIRY] Created:', inquiry.id);

      res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully',
        data: inquiry,
      });
    } catch (error: any) {
      console.error('[INQUIRY] ERROR:', error?.message || error);
      console.error('[INQUIRY] Stack:', error?.stack);
      next(error);
    }
  },

  /**
   * GET /inquiries/my
   * Get user's own inquiries
   */
  async getMyInquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const query = inquiryQuerySchema.parse(req.query);
      const result = await inquiryService.getUserInquiries(req.user!.id, query);

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
   * GET /inquiries/my/:id
   * Get user's inquiry by ID
   */
  async getMyInquiryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const inquiry = await inquiryService.getUserInquiryById(id, req.user!.id);

      res.status(200).json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /inquiries (admin)
   * Get all inquiries
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = inquiryQuerySchema.parse(req.query);
      const result = await inquiryService.getInquiries(query);

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
   * GET /inquiries/stats (admin)
   * Get inquiry statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await inquiryService.getInquiryStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /inquiries/:id (admin)
   * Get inquiry by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const inquiry = await inquiryService.getInquiryById(id);

      res.status(200).json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /inquiries/:id/reply (admin)
   * Reply to an inquiry
   */
  async reply(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = replyInquirySchema.parse(req.body);
      const inquiry = await inquiryService.replyToInquiry(id, data, req.user!.id);

      res.status(200).json({
        success: true,
        message: 'Reply sent successfully',
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /inquiries/:id/status (admin)
   * Update inquiry status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateInquiryStatusSchema.parse(req.body);
      const inquiry = await inquiryService.updateInquiryStatus(id, data);

      res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /inquiries/:id (admin)
   * Delete an inquiry
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await inquiryService.deleteInquiry(id);

      res.status(200).json({
        success: true,
        message: 'Inquiry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
