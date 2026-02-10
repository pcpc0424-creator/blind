import { z } from 'zod';

// Report reason enum
export const ReportReasonEnum = z.enum([
  'SPAM',
  'HARASSMENT',
  'HATE_SPEECH',
  'MISINFORMATION',
  'PRIVACY_VIOLATION',
  'INAPPROPRIATE_CONTENT',
  'OTHER',
]);

// Create report schema
export const createReportSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: ReportReasonEnum,
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1,000 characters')
    .optional(),
}).refine(
  (data) => data.postId || data.commentId || data.reportedUserId,
  { message: 'Report target is required' }
);

// Report query params schema (admin)
export const reportQuerySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']).optional(),
  reason: ReportReasonEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Resolve report schema (admin)
export const resolveReportSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolution: z.string().max(1000).optional(),
});

export type ReportReason = z.infer<typeof ReportReasonEnum>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
