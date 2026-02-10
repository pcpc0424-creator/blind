import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';

export const settingsController = {
  /**
   * GET /settings/admin
   * Get all settings (admin)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getAllSettings();

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /settings/admin/:category
   * Get settings by category (admin)
   */
  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const settings = await settingsService.getSettingsByCategory(category);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /settings/admin/key/:key
   * Get a single setting by key (admin)
   */
  async getByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSetting(key);

      if (!setting) {
        return res.status(404).json({
          success: false,
          error: 'Setting not found.',
        });
      }

      res.status(200).json({
        success: true,
        data: setting,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /settings/admin
   * Update multiple settings (admin)
   */
  async updateAll(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = req.body;
      const result = await settingsService.updateSettings(settings);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /settings/admin/:key
   * Update a single setting (admin)
   */
  async updateByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await settingsService.updateSetting(key, value);

      res.status(200).json({
        success: true,
        data: {
          key: setting.key,
          value: settingsService.parseValue(setting.value, setting.type),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /settings/admin/initialize
   * Initialize default settings (admin)
   */
  async initialize(req: Request, res: Response, next: NextFunction) {
    try {
      await settingsService.initializeDefaults();

      res.status(200).json({
        success: true,
        message: 'Default settings initialized.',
      });
    } catch (error) {
      next(error);
    }
  },
};
