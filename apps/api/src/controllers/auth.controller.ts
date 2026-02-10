import { Request, Response, NextFunction } from 'express';
import {
  registerEmailSchema,
  verifyEmailSchema,
  completeRegistrationSchema,
  registerGeneralSchema,
  loginSchema,
  registerGeneralEmailSchema,
  verifyGeneralEmailSchema,
  completeGeneralRegistrationSchema,
} from '@blind/shared';
import { authService } from '../services/auth.service';

// Helper to determine if request is over HTTPS (directly or via proxy)
const isSecureRequest = (req: Request): boolean => {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
};

export const authController = {
  /**
   * POST /auth/register
   * Step 1: Submit email for verification
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerEmailSchema.parse(req.body);
      const result = await authService.registerEmail(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/verify-email
   * Step 2: Verify email with code
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const input = verifyEmailSchema.parse(req.body);
      const result = await authService.verifyEmail(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/complete
   * Step 3: Complete registration with password
   */
  async completeRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const input = completeRegistrationSchema.parse(req.body);
      const result = await authService.completeRegistration(
        input,
        req.headers['user-agent'],
        req.ip
      );

      // Set cookie
      res.cookie('token', result.tokens.accessToken, {
        httpOnly: true,
        secure: isSecureRequest(req),
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/register-general
   * Register as general user without company verification
   */
  async registerGeneral(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerGeneralSchema.parse(req.body);
      const result = await authService.registerGeneral(
        input,
        req.headers['user-agent'],
        req.ip
      );

      // Set cookie
      res.cookie('token', result.tokens.accessToken, {
        httpOnly: true,
        secure: isSecureRequest(req),
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/login
   * Login with nickname and password
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(
        input,
        req.headers['user-agent'],
        req.ip
      );

      // Set cookie
      res.cookie('token', result.tokens.accessToken, {
        httpOnly: true,
        secure: isSecureRequest(req),
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/logout
   * Logout and invalidate session
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await authService.logout(req.user.sessionId);
      }

      res.clearCookie('token');

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully.' },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/register-general-email
   * Step 1: Submit email for general user verification
   */
  async registerGeneralEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerGeneralEmailSchema.parse(req.body);
      const result = await authService.registerGeneralEmail(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/verify-general-email
   * Step 2: Verify email with code for general users
   */
  async verifyGeneralEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const input = verifyGeneralEmailSchema.parse(req.body);
      const result = await authService.verifyGeneralEmail(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/complete-general
   * Step 3: Complete general user registration with username and password
   */
  async completeGeneral(req: Request, res: Response, next: NextFunction) {
    try {
      const input = completeGeneralRegistrationSchema.parse(req.body);
      const result = await authService.completeGeneralRegistration(
        input,
        req.headers['user-agent'],
        req.ip
      );

      // Set cookie
      res.cookie('token', result.tokens.accessToken, {
        httpOnly: true,
        secure: isSecureRequest(req),
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/forgot-password
   * Step 1: Request password reset - send verification code to email
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Please enter your email.' },
        });
      }

      const result = await authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/verify-reset-code
   * Step 2: Verify the password reset code
   */
  async verifyResetCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Please enter email and verification code.' },
        });
      }

      const result = await authService.verifyPasswordResetCode(email, code);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/reset-password
   * Step 3: Complete password reset with new password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { tempToken, password } = req.body;
      if (!tempToken || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Please enter token and new password.' },
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters.' },
        });
      }

      const result = await authService.completePasswordReset(tempToken, password);

      // Clear any existing auth cookie
      res.clearCookie('token', { path: '/' });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
