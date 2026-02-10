import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@blind/database';
import {
  generateNickname,
  generateVerificationCode,
  extractEmailDomain,
  ERROR_CODES,
  RegisterEmailInput,
  VerifyEmailInput,
  CompleteRegistrationInput,
  RegisterGeneralInput,
  LoginInput,
  RegisterGeneralEmailInput,
  VerifyGeneralEmailInput,
  CompleteGeneralRegistrationInput,
} from '@blind/shared';
import config from '../config';
import { AppError } from '../middleware/error.middleware';
import { emailService } from './email.service';
import { settingsService } from './settings.service';

/**
 * Hash an email with a salt for anonymous storage
 */
function hashEmail(email: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase() + salt)
    .digest('hex');
}

/**
 * Generate a random salt
 */
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate JWT token
 */
function generateToken(userId: string, sessionId: string): string {
  // expiresIn format: '7d', '24h', etc.
  return jwt.sign(
    { userId, sessionId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}

/**
 * Calculate token expiration date
 */
async function getTokenExpiration(): Promise<Date> {
  const setting = await settingsService.getSetting('security.sessionExpireDays');
  const days = setting?.value ?? 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Check if registration is enabled
 */
async function checkRegistrationEnabled(): Promise<void> {
  const setting = await settingsService.getSetting('site.registrationEnabled');
  if (setting?.value === false) {
    throw new AppError(403, ERROR_CODES.REGISTRATION_DISABLED, 'Registration is currently disabled.');
  }
}

/**
 * Validate password length against settings
 */
async function validatePasswordLength(password: string): Promise<void> {
  const setting = await settingsService.getSetting('security.minPasswordLength');
  const minLength = setting?.value ?? 8;
  if (password.length < minLength) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      `Password must be at least ${minLength} characters.`
    );
  }
}

export const authService = {
  /**
   * Step 1: Register email and send verification code
   */
  async registerEmail(input: RegisterEmailInput) {
    // Check if registration is enabled
    await checkRegistrationEnabled();

    const email = input.email.toLowerCase();
    const domain = extractEmailDomain(email);

    // Find company by email domain
    const companyDomain = await prisma.companyDomain.findUnique({
      where: { domain },
      include: { company: true },
    });

    if (!companyDomain) {
      throw new AppError(
        400,
        ERROR_CODES.INVALID_COMPANY_DOMAIN,
        'Unregistered company email domain. Please check your company domain.'
      );
    }

    // Generate salt and hash for the email
    const salt = generateSalt();
    const emailHash = hashEmail(email, salt);

    // Check if email is already registered (using hash)
    // Note: We need to check all records since we can't recreate the exact hash without the salt
    // This is a trade-off for anonymity - we use a new hash each time
    // In production, consider a bloom filter or similar approach

    // Generate verification code
    const code = generateVerificationCode();
    const codeExpiresAt = new Date(
      Date.now() + config.auth.verificationCodeExpiryMinutes * 60 * 1000
    );

    // Upsert email verification record
    // Using emailHash as unique identifier
    await prisma.emailVerification.upsert({
      where: { emailHash },
      update: {
        code,
        codeExpiresAt,
        verified: false,
        tempToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date(),
      },
      create: {
        emailHash,
        emailSalt: salt,
        companyId: companyDomain.companyId,
        code,
        codeExpiresAt,
      },
    });

    // Send verification email
    await emailService.sendVerificationCode(email, code, companyDomain.company.name);

    return {
      message: 'Verification code has been sent.',
      company: {
        id: companyDomain.company.id,
        name: companyDomain.company.name,
        slug: companyDomain.company.slug,
        logoUrl: companyDomain.company.logoUrl,
        isVerified: companyDomain.company.isVerified,
      },
      expiresAt: codeExpiresAt.toISOString(),
    };
  },

  /**
   * Step 2: Verify email with code
   */
  async verifyEmail(input: VerifyEmailInput) {
    const email = input.email.toLowerCase();
    const domain = extractEmailDomain(email);

    // Find the company first
    const companyDomain = await prisma.companyDomain.findUnique({
      where: { domain },
      include: { company: true },
    });

    if (!companyDomain) {
      throw new AppError(400, ERROR_CODES.INVALID_COMPANY_DOMAIN, 'Invalid email.');
    }

    // Find all verification records for this company to check the code
    // Since we can't directly look up by email (anonymized), we verify by code + company
    const verifications = await prisma.emailVerification.findMany({
      where: {
        companyId: companyDomain.companyId,
        code: input.code,
        verified: false,
        codeExpiresAt: { gt: new Date() },
      },
    });

    // Find the matching verification by checking the hash
    let matchingVerification = null;
    for (const verification of verifications) {
      const expectedHash = hashEmail(email, verification.emailSalt);
      if (expectedHash === verification.emailHash) {
        matchingVerification = verification;
        break;
      }
    }

    if (!matchingVerification) {
      throw new AppError(
        400,
        ERROR_CODES.INVALID_VERIFICATION_CODE,
        'Verification code is invalid or expired.'
      );
    }

    // Generate temp token for registration completion
    const tempToken = uuidv4();
    const tokenExpiresAt = new Date(
      Date.now() + config.auth.tempTokenExpiryMinutes * 60 * 1000
    );

    await prisma.emailVerification.update({
      where: { id: matchingVerification.id },
      data: {
        verified: true,
        tempToken,
        tokenExpiresAt,
      },
    });

    return {
      tempToken,
      expiresAt: tokenExpiresAt.toISOString(),
      company: {
        id: companyDomain.company.id,
        name: companyDomain.company.name,
        slug: companyDomain.company.slug,
        logoUrl: companyDomain.company.logoUrl,
        isVerified: companyDomain.company.isVerified,
      },
    };
  },

  /**
   * Step 3: Complete registration
   */
  async completeRegistration(
    input: CompleteRegistrationInput,
    userAgent?: string,
    ipAddress?: string
  ) {
    // Validate password length
    await validatePasswordLength(input.password);

    // Find verification by temp token
    const verification = await prisma.emailVerification.findUnique({
      where: { tempToken: input.tempToken },
      include: { company: true },
    });

    if (!verification || !verification.verified) {
      throw new AppError(400, ERROR_CODES.INVALID_TEMP_TOKEN, 'Invalid authentication token.');
    }

    if (verification.tokenExpiresAt && verification.tokenExpiresAt < new Date()) {
      throw new AppError(400, ERROR_CODES.INVALID_TEMP_TOKEN, 'Authentication token has expired.');
    }

    // Check if email is already registered (1 email = 1 account)
    const existingUser = await prisma.user.findUnique({
      where: { emailHash: verification.emailHash },
    });

    if (existingUser) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'An account with this email already exists.'
      );
    }

    // Generate unique anonymous nickname
    let nickname = generateNickname();
    let attempts = 0;
    while (await prisma.user.findUnique({ where: { nickname } })) {
      nickname = generateNickname();
      attempts++;
      if (attempts > 10) {
        // Add timestamp to ensure uniqueness
        nickname = `${nickname.split('_').slice(0, 2).join('_')}_${Date.now() % 10000}`;
        break;
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with email hash for duplicate prevention
      const user = await tx.user.create({
        data: {
          nickname,
          passwordHash,
          emailHash: verification.emailHash,
          emailSalt: verification.emailSalt,
          companyId: verification.companyId,
          companyVerified: true,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              isVerified: true,
            },
          },
        },
      });

      // Create session
      const session = await tx.session.create({
        data: {
          userId: user.id,
          token: generateToken(user.id, uuidv4()), // Temporary, will update
          userAgent,
          ipAddress,
          expiresAt: await getTokenExpiration(),
        },
      });

      // Update session with proper token
      const token = generateToken(user.id, session.id);
      await tx.session.update({
        where: { id: session.id },
        data: { token },
      });

      // Invalidate the temp token
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { tempToken: null, tokenExpiresAt: null },
      });

      // Auto-join company community
      const companyCommunity = await tx.community.findFirst({
        where: {
          companyId: verification.companyId,
          type: 'COMPANY',
        },
      });

      if (companyCommunity) {
        await tx.communityMember.create({
          data: {
            communityId: companyCommunity.id,
            userId: user.id,
          },
        });

        // Update member count
        await tx.community.update({
          where: { id: companyCommunity.id },
          data: { memberCount: { increment: 1 } },
        });
      }

      return { user, token, session };
    });

    return {
      user: {
        id: result.user.id,
        nickname: result.user.nickname,
        companyVerified: result.user.companyVerified,
        role: result.user.role,
        status: result.user.status,
        createdAt: result.user.createdAt.toISOString(),
        company: result.user.company,
      },
      tokens: {
        accessToken: result.token,
        expiresAt: result.session.expiresAt.toISOString(),
      },
    };
  },

  /**
   * Register general user (without company verification)
   */
  async registerGeneral(
    input: RegisterGeneralInput,
    userAgent?: string,
    ipAddress?: string
  ) {
    // Check if registration is enabled
    await checkRegistrationEnabled();

    // Validate password length
    await validatePasswordLength(input.password);

    const username = input.username.toLowerCase();

    // Check if username already exists as nickname
    const existingUser = await prisma.user.findUnique({
      where: { nickname: username },
    });

    if (existingUser) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'This username is already taken. Please choose another.'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with username as nickname (no company)
      const user = await tx.user.create({
        data: {
          nickname: username,
          passwordHash,
          companyId: null,
          companyVerified: false,
        },
      });

      // Create session
      const session = await tx.session.create({
        data: {
          userId: user.id,
          token: generateToken(user.id, uuidv4()),
          userAgent,
          ipAddress,
          expiresAt: await getTokenExpiration(),
        },
      });

      // Update session with proper token
      const token = generateToken(user.id, session.id);
      await tx.session.update({
        where: { id: session.id },
        data: { token },
      });

      return { user, token, session };
    });

    return {
      user: {
        id: result.user.id,
        nickname: result.user.nickname,
        companyVerified: result.user.companyVerified,
        role: result.user.role,
        status: result.user.status,
        createdAt: result.user.createdAt.toISOString(),
        company: null,
      },
      tokens: {
        accessToken: result.token,
        expiresAt: result.session.expiresAt.toISOString(),
      },
    };
  },

  /**
   * Login with nickname and password
   */
  async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { nickname: input.nickname },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid nickname or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Account has been suspended.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid nickname or password.');
    }

    // Create session
    const sessionId = uuidv4();
    const token = generateToken(user.id, sessionId);
    const expiresAt = await getTokenExpiration();

    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        companyVerified: user.companyVerified,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        company: user.company,
      },
      tokens: {
        accessToken: token,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  },

  /**
   * Logout - invalidate session
   */
  async logout(sessionId: string) {
    await prisma.session.delete({
      where: { id: sessionId },
    }).catch(() => {
      // Session might already be deleted
    });
  },

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found.');
    }

    // Get total votes received
    const votesReceived = await prisma.vote.count({
      where: {
        OR: [
          { post: { authorId: userId } },
          { comment: { authorId: userId } },
        ],
        value: 1,
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      companyVerified: user.companyVerified,
      role: user.role,
      status: user.status,
      lastActiveAt: user.lastActiveAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      company: user.company,
      postCount: user._count.posts,
      commentCount: user._count.comments,
      totalVotesReceived: votesReceived,
    };
  },

  /**
   * Step 1: Register general user email and send verification code
   */
  async registerGeneralEmail(input: RegisterGeneralEmailInput) {
    // Check if registration is enabled
    await checkRegistrationEnabled();

    const email = input.email.toLowerCase();
    const domain = extractEmailDomain(email);

    // Check if email domain belongs to a company (should use company verification instead)
    const companyDomain = await prisma.companyDomain.findUnique({
      where: { domain },
      include: { company: true },
    });

    if (companyDomain) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'This is a company email. Please use company verification to sign up.'
      );
    }

    // Generate salt and hash for the email
    const salt = generateSalt();
    const emailHash = hashEmail(email, salt);

    // Generate verification code
    const code = generateVerificationCode();
    const codeExpiresAt = new Date(
      Date.now() + config.auth.verificationCodeExpiryMinutes * 60 * 1000
    );

    // Upsert email verification record
    await prisma.emailVerification.upsert({
      where: { emailHash },
      update: {
        code,
        codeExpiresAt,
        verified: false,
        tempToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date(),
      },
      create: {
        emailHash,
        emailSalt: salt,
        companyId: null,
        type: 'GENERAL',
        code,
        codeExpiresAt,
      },
    });

    // Send verification email
    await emailService.sendVerificationCode(email, code, 'Blind');

    return {
      message: 'Verification code has been sent.',
      expiresAt: codeExpiresAt.toISOString(),
    };
  },

  /**
   * Step 2: Verify general user email with code
   */
  async verifyGeneralEmail(input: VerifyGeneralEmailInput) {
    const email = input.email.toLowerCase();

    // Find all verification records for GENERAL type to check the code
    const verifications = await prisma.emailVerification.findMany({
      where: {
        type: 'GENERAL',
        code: input.code,
        verified: false,
        codeExpiresAt: { gt: new Date() },
      },
    });

    // Find the matching verification by checking the hash
    let matchingVerification = null;
    for (const verification of verifications) {
      const expectedHash = hashEmail(email, verification.emailSalt);
      if (expectedHash === verification.emailHash) {
        matchingVerification = verification;
        break;
      }
    }

    if (!matchingVerification) {
      throw new AppError(
        400,
        ERROR_CODES.INVALID_VERIFICATION_CODE,
        'Verification code is invalid or expired.'
      );
    }

    // Generate temp token for registration completion
    const tempToken = uuidv4();
    const tokenExpiresAt = new Date(
      Date.now() + config.auth.tempTokenExpiryMinutes * 60 * 1000
    );

    await prisma.emailVerification.update({
      where: { id: matchingVerification.id },
      data: {
        verified: true,
        tempToken,
        tokenExpiresAt,
      },
    });

    return {
      tempToken,
      expiresAt: tokenExpiresAt.toISOString(),
    };
  },

  /**
   * Step 3: Complete general user registration with username and password
   */
  async completeGeneralRegistration(
    input: CompleteGeneralRegistrationInput,
    userAgent?: string,
    ipAddress?: string
  ) {
    // Validate password length
    await validatePasswordLength(input.password);

    // Find verification by temp token
    const verification = await prisma.emailVerification.findUnique({
      where: { tempToken: input.tempToken },
    });

    if (!verification || !verification.verified) {
      throw new AppError(400, ERROR_CODES.INVALID_TEMP_TOKEN, 'Invalid authentication token.');
    }

    if (verification.tokenExpiresAt && verification.tokenExpiresAt < new Date()) {
      throw new AppError(400, ERROR_CODES.INVALID_TEMP_TOKEN, 'Authentication token has expired.');
    }

    if (verification.type !== 'GENERAL') {
      throw new AppError(400, ERROR_CODES.INVALID_TEMP_TOKEN, 'Invalid authentication token.');
    }

    // Check if email is already registered (1 email = 1 account)
    const existingEmailUser = await prisma.user.findUnique({
      where: { emailHash: verification.emailHash },
    });

    if (existingEmailUser) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'An account with this email already exists.'
      );
    }

    const username = input.username.toLowerCase();

    // Check if username already exists as nickname
    const existingUser = await prisma.user.findUnique({
      where: { nickname: username },
    });

    if (existingUser) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'This username is already taken. Please choose another.'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with username as nickname and email hash (no company)
      const user = await tx.user.create({
        data: {
          nickname: username,
          passwordHash,
          emailHash: verification.emailHash,
          emailSalt: verification.emailSalt,
          companyId: null,
          companyVerified: false,
        },
      });

      // Create session
      const session = await tx.session.create({
        data: {
          userId: user.id,
          token: generateToken(user.id, uuidv4()),
          userAgent,
          ipAddress,
          expiresAt: await getTokenExpiration(),
        },
      });

      // Update session with proper token
      const token = generateToken(user.id, session.id);
      await tx.session.update({
        where: { id: session.id },
        data: { token },
      });

      // Invalidate the temp token
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { tempToken: null, tokenExpiresAt: null },
      });

      return { user, token, session };
    });

    return {
      user: {
        id: result.user.id,
        nickname: result.user.nickname,
        companyVerified: result.user.companyVerified,
        role: result.user.role,
        status: result.user.status,
        createdAt: result.user.createdAt.toISOString(),
        company: null,
      },
      tokens: {
        accessToken: result.token,
        expiresAt: result.session.expiresAt.toISOString(),
      },
    };
  },

  /**
   * Request password reset - sends verification code to email
   */
  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase();

    // Find users with this email by checking all email hashes
    // Since we can't reverse the hash, we need to find users and verify the email
    const users = await prisma.user.findMany({
      where: {
        emailHash: { not: null },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        emailHash: true,
        emailSalt: true,
      },
    });

    // Find matching user by recomputing hash
    let matchingUser = null;
    for (const user of users) {
      if (user.emailSalt) {
        const expectedHash = hashEmail(normalizedEmail, user.emailSalt);
        if (expectedHash === user.emailHash) {
          matchingUser = user;
          break;
        }
      }
    }

    if (!matchingUser) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email is registered, a verification code will be sent.',
        expiresAt: new Date(Date.now() + config.auth.verificationCodeExpiryMinutes * 60 * 1000).toISOString(),
      };
    }

    // Generate verification code
    const code = generateVerificationCode();
    const codeExpiresAt = new Date(
      Date.now() + config.auth.verificationCodeExpiryMinutes * 60 * 1000
    );

    // Create or update password reset record
    await prisma.passwordReset.upsert({
      where: { emailHash: matchingUser.emailHash! },
      update: {
        code,
        codeExpiresAt,
        verified: false,
        tempToken: null,
        tokenExpiresAt: null,
        usedAt: null,
        updatedAt: new Date(),
      },
      create: {
        emailHash: matchingUser.emailHash!,
        emailSalt: matchingUser.emailSalt!,
        code,
        codeExpiresAt,
      },
    });

    // Send verification email
    await emailService.sendPasswordResetCode(normalizedEmail, code);

    return {
      message: 'If the email is registered, a verification code will be sent.',
      expiresAt: codeExpiresAt.toISOString(),
    };
  },

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(email: string, code: string) {
    const normalizedEmail = email.toLowerCase();

    // Find password reset records with matching code
    const resets = await prisma.passwordReset.findMany({
      where: {
        code,
        verified: false,
        usedAt: null,
        codeExpiresAt: { gt: new Date() },
      },
    });

    // Find matching reset by checking email hash
    let matchingReset = null;
    for (const reset of resets) {
      const expectedHash = hashEmail(normalizedEmail, reset.emailSalt);
      if (expectedHash === reset.emailHash) {
        matchingReset = reset;
        break;
      }
    }

    if (!matchingReset) {
      throw new AppError(
        400,
        ERROR_CODES.INVALID_VERIFICATION_CODE,
        'Verification code is invalid or expired.'
      );
    }

    // Generate temp token for password reset
    const tempToken = uuidv4();
    const tokenExpiresAt = new Date(
      Date.now() + config.auth.tempTokenExpiryMinutes * 60 * 1000
    );

    await prisma.passwordReset.update({
      where: { id: matchingReset.id },
      data: {
        verified: true,
        tempToken,
        tokenExpiresAt,
      },
    });

    return {
      tempToken,
      expiresAt: tokenExpiresAt.toISOString(),
    };
  },

  /**
   * Complete password reset with new password
   */
  async completePasswordReset(tempToken: string, newPassword: string) {
    // Find reset by temp token
    const reset = await prisma.passwordReset.findUnique({
      where: { tempToken },
    });

    if (!reset || !reset.verified || reset.usedAt) {
      throw new AppError(400, ERROR_CODES.INVALID_TEMP_TOKEN, 'Invalid authentication token.');
    }

    if (reset.tokenExpiresAt && reset.tokenExpiresAt < new Date()) {
      throw new AppError(400, ERROR_CODES.INVALID_TEMP_TOKEN, 'Authentication token has expired.');
    }

    // Find user by email hash
    const user = await prisma.user.findUnique({
      where: { emailHash: reset.emailHash },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found.');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Account has been suspended.');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and mark reset as used
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.passwordReset.update({
        where: { id: reset.id },
        data: {
          usedAt: new Date(),
          tempToken: null,
          tokenExpiresAt: null,
        },
      });

      // Invalidate all existing sessions for security
      await tx.session.deleteMany({
        where: { userId: user.id },
      });
    });

    return {
      message: 'Password has been changed. Please log in again.',
    };
  },
};
