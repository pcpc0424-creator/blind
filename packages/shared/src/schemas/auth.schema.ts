import { z } from 'zod';

// Email registration schema
export const registerEmailSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((email) => email.toLowerCase().trim()),
});

// Verify email schema
export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

// Complete registration schema
export const completeRegistrationSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain both letters and numbers'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// General user registration schema (without company verification)
export const registerGeneralSchema = z.object({
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .transform((username) => username.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain both letters and numbers'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((email) => email.toLowerCase().trim()),
  password: z.string().min(1, 'Please enter your password'),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Please enter your current password'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain both letters and numbers'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// General account email registration schema
export const registerGeneralEmailSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((email) => email.toLowerCase().trim()),
});

// General account email verification schema
export const verifyGeneralEmailSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

// General account registration completion schema
export const completeGeneralRegistrationSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .transform((username) => username.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain both letters and numbers'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
export type RegisterGeneralInput = z.infer<typeof registerGeneralSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RegisterGeneralEmailInput = z.infer<typeof registerGeneralEmailSchema>;
export type VerifyGeneralEmailInput = z.infer<typeof verifyGeneralEmailSchema>;
export type CompleteGeneralRegistrationInput = z.infer<typeof completeGeneralRegistrationSchema>;
