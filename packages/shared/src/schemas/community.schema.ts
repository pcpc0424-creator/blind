import { z } from 'zod';

// Community type enum
export const CommunityTypeEnum = z.enum([
  'COMPANY',
  'INDUSTRY',
  'JOB',
  'GENERAL',
  'REGIONAL',
]);

// Community query params schema
export const communityQuerySchema = z.object({
  type: CommunityTypeEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Join community schema
export const joinCommunitySchema = z.object({
  communityId: z.string().min(1, 'Community ID is required'),
});

export type CommunityType = z.infer<typeof CommunityTypeEnum>;
export type CommunityQueryInput = z.infer<typeof communityQuerySchema>;
export type JoinCommunityInput = z.infer<typeof joinCommunitySchema>;
