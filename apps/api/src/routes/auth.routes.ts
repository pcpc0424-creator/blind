import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes - Company verification flow
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/complete', authController.completeRegistration);

// Public routes - General user with email verification flow
router.post('/register-general-email', authController.registerGeneralEmail);
router.post('/verify-general-email', authController.verifyGeneralEmail);
router.post('/complete-general', authController.completeGeneral);

// Password reset flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

router.post('/login', authController.login);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
