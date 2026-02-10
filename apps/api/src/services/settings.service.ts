import { prisma, Prisma } from '@blind/database';
import { AppError } from '../middleware/error.middleware';
import { ERROR_CODES } from '@blind/shared';

// Default settings configuration
const DEFAULT_SETTINGS: Record<string, { value: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'; category: string; label: string; description: string }> = {
  // General settings
  'site.name': {
    value: 'Blind',
    type: 'STRING',
    category: 'general',
    label: 'Site Name',
    description: 'The name of the site.',
  },
  'site.description': {
    value: 'Anonymous Workplace Community',
    type: 'STRING',
    category: 'general',
    label: 'Site Description',
    description: 'A brief description of the site.',
  },
  'site.maintenanceMode': {
    value: 'false',
    type: 'BOOLEAN',
    category: 'general',
    label: 'Maintenance Mode',
    description: 'When enabled, only admins can access the site.',
  },
  'site.registrationEnabled': {
    value: 'true',
    type: 'BOOLEAN',
    category: 'general',
    label: 'Allow Registration',
    description: 'Allow new user registrations.',
  },
  'site.maxPostsPerDay': {
    value: '10',
    type: 'NUMBER',
    category: 'general',
    label: 'Daily Post Limit',
    description: 'Maximum number of posts a user can create per day.',
  },
  'site.maxCommentsPerDay': {
    value: '50',
    type: 'NUMBER',
    category: 'general',
    label: 'Daily Comment Limit',
    description: 'Maximum number of comments a user can create per day.',
  },

  // Security settings
  'security.emailVerificationRequired': {
    value: 'true',
    type: 'BOOLEAN',
    category: 'security',
    label: 'Email Verification Required',
    description: 'Require email verification for registration.',
  },
  'security.minPasswordLength': {
    value: '8',
    type: 'NUMBER',
    category: 'security',
    label: 'Minimum Password Length',
    description: 'Minimum number of characters for passwords.',
  },
  'security.sessionExpireDays': {
    value: '7',
    type: 'NUMBER',
    category: 'security',
    label: 'Session Expiry (Days)',
    description: 'Duration that login sessions remain valid.',
  },

  // Email settings
  'email.smtpHost': {
    value: '',
    type: 'STRING',
    category: 'email',
    label: 'SMTP Server',
    description: 'SMTP server address.',
  },
  'email.smtpPort': {
    value: '587',
    type: 'NUMBER',
    category: 'email',
    label: 'SMTP Port',
    description: 'SMTP server port.',
  },
  'email.smtpSecure': {
    value: 'tls',
    type: 'STRING',
    category: 'email',
    label: 'Security Mode',
    description: 'SMTP security mode. (none, ssl, tls)',
  },
  'email.fromAddress': {
    value: '',
    type: 'STRING',
    category: 'email',
    label: 'From Email',
    description: 'Sender email address for outgoing emails.',
  },
  'email.fromName': {
    value: 'Blind',
    type: 'STRING',
    category: 'email',
    label: 'From Name',
    description: 'Sender name displayed on outgoing emails.',
  },

  // Notification settings
  'notification.newSignup': {
    value: 'true',
    type: 'BOOLEAN',
    category: 'notifications',
    label: 'New Signup Notification',
    description: 'Notify admins when a new user signs up.',
  },
  'notification.newReport': {
    value: 'true',
    type: 'BOOLEAN',
    category: 'notifications',
    label: 'Report Notification',
    description: 'Notify admins when a new report is submitted.',
  },
  'notification.communityRequest': {
    value: 'true',
    type: 'BOOLEAN',
    category: 'notifications',
    label: 'Community Request Notification',
    description: 'Notify admins when a new community request is submitted.',
  },
};

export const settingsService = {
  /**
   * Initialize default settings (should be called on app startup)
   */
  async initializeDefaults() {
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await prisma.siteSetting.findUnique({ where: { key } });
      if (!existing) {
        await prisma.siteSetting.create({
          data: {
            key,
            value: config.value,
            type: config.type,
            category: config.category,
            label: config.label,
            description: config.description,
          },
        });
      }
    }
  },

  /**
   * Get all settings
   */
  async getAllSettings() {
    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push({
        key: setting.key,
        value: this.parseValue(setting.value, setting.type),
        type: setting.type,
        label: setting.label,
        description: setting.description,
      });
    }

    return grouped;
  },

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string) {
    const settings = await prisma.siteSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    return settings.map((s) => ({
      key: s.key,
      value: this.parseValue(s.value, s.type),
      type: s.type,
      label: s.label,
      description: s.description,
    }));
  },

  /**
   * Get a single setting by key
   */
  async getSetting(key: string) {
    const setting = await prisma.siteSetting.findUnique({ where: { key } });

    if (!setting) {
      // Return default if exists
      const defaultSetting = DEFAULT_SETTINGS[key];
      if (defaultSetting) {
        return {
          key,
          value: this.parseValue(defaultSetting.value, defaultSetting.type),
          type: defaultSetting.type,
        };
      }
      return null;
    }

    return {
      key: setting.key,
      value: this.parseValue(setting.value, setting.type),
      type: setting.type,
    };
  },

  /**
   * Update a single setting
   */
  async updateSetting(key: string, value: any) {
    const existing = await prisma.siteSetting.findUnique({ where: { key } });

    if (!existing) {
      // Check if it's a known default setting
      const defaultSetting = DEFAULT_SETTINGS[key];
      if (!defaultSetting) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Setting not found.');
      }

      // Create the setting
      return prisma.siteSetting.create({
        data: {
          key,
          value: this.stringifyValue(value, defaultSetting.type),
          type: defaultSetting.type,
          category: defaultSetting.category,
          label: defaultSetting.label,
          description: defaultSetting.description,
        },
      });
    }

    return prisma.siteSetting.update({
      where: { key },
      data: { value: this.stringifyValue(value, existing.type) },
    });
  },

  /**
   * Update multiple settings at once
   */
  async updateSettings(settings: Record<string, any>) {
    const updates = [];

    for (const [key, value] of Object.entries(settings)) {
      updates.push(this.updateSetting(key, value));
    }

    await Promise.all(updates);
    return { message: 'Settings saved.' };
  },

  /**
   * Parse string value to appropriate type
   */
  parseValue(value: string, type: string): any {
    switch (type) {
      case 'NUMBER':
        return parseInt(value, 10);
      case 'BOOLEAN':
        return value === 'true';
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      default:
        return value;
    }
  },

  /**
   * Convert value to string for storage
   */
  stringifyValue(value: any, type: string): string {
    switch (type) {
      case 'NUMBER':
        return String(value);
      case 'BOOLEAN':
        return value ? 'true' : 'false';
      case 'JSON':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  },
};
