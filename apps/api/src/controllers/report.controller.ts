import { Request, Response, NextFunction } from 'express';
import {
  createReportSchema,
  reportQuerySchema,
  resolveReportSchema,
} from '@blind/shared';
import { reportService } from '../services/report.service';

export const reportController = {
  /**
   * POST /reports
   * Create a new report
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createReportSchema.parse(req.body);
      const report = await reportService.createReport(data, req.user!.id);

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reports (admin)
   * Get list of reports
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const query = reportQuerySchema.parse(req.query);
      const result = await reportService.getReports(query);

      res.status(200).json({
        success: true,
        data: result.reports,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reports/stats (admin)
   * Get report statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reportService.getReportStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reports/:id (admin)
   * Get report by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /reports/:id/resolve (admin)
   * Resolve a report
   */
  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = resolveReportSchema.parse(req.body);
      const report = await reportService.resolveReport(id, data, req.user!.id);

      res.status(200).json({
        success: true,
        message: 'Report processed successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /reports/:id/hide (admin)
   * Hide the reported content
   */
  async hideContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportService.hideContent(id, req.user!.id);

      res.status(200).json({
        success: true,
        message: 'Content has been hidden',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /reports/:id/delete (admin)
   * Delete the reported content
   */
  async deleteContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportService.deleteContent(id, req.user!.id);

      res.status(200).json({
        success: true,
        message: 'Content has been deleted',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },
};
