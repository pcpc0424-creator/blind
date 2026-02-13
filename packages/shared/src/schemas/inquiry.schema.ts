import { z } from 'zod';

// Inquiry category enum
export const InquiryCategoryEnum = z.enum([
  'BUG_REPORT',
  'FEATURE_REQUEST',
  'ACCOUNT_ISSUE',
  'REPORT_ISSUE',
  'GENERAL',
  'OTHER',
]);

// Inquiry status enum
export const InquiryStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'ANSWERED',
  'CLOSED',
]);

// Create inquiry schema (user)
export const createInquirySchema = z.object({
  category: InquiryCategoryEnum,
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content cannot exceed 5,000 characters'),
});

// Inquiry query params schema
export const inquiryQuerySchema = z.object({
  status: InquiryStatusEnum.optional(),
  category: InquiryCategoryEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Reply to inquiry schema (admin)
export const replyInquirySchema = z.object({
  adminReply: z
    .string()
    .min(1, 'Reply cannot be empty')
    .max(5000, 'Reply cannot exceed 5,000 characters'),
  status: InquiryStatusEnum.optional(),
});

// Update inquiry status schema (admin)
export const updateInquiryStatusSchema = z.object({
  status: InquiryStatusEnum,
});

export type InquiryCategory = z.infer<typeof InquiryCategoryEnum>;
export type InquiryStatus = z.infer<typeof InquiryStatusEnum>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type InquiryQueryInput = z.infer<typeof inquiryQuerySchema>;
export type ReplyInquiryInput = z.infer<typeof replyInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
