import { z } from 'zod';

// Create post schema
export const createPostSchema = z.object({
  communityId: z.string().min(1, 'Please select a community'),
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content cannot exceed 10,000 characters'),
  isAnonymous: z.boolean().default(true),
  tags: z.array(z.string()).max(5, 'You can add up to 5 tags').optional(),
  mediaUrls: z.array(z.string().url()).max(10, 'You can add up to 10 images').optional(),
  videoUrl: z.string().url().optional(),
});

// Update post schema
export const updatePostSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content cannot exceed 10,000 characters')
    .optional(),
  tags: z.array(z.string()).max(5, 'You can add up to 5 tags').optional(),
});

// Post query params schema
export const postQuerySchema = z.object({
  communityId: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'trending']).default('latest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().optional(),
  tag: z.string().optional(),
});

// Vote schema
export const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]), // 1: upvote, -1: downvote, 0: remove vote
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;
export type VoteInput = z.infer<typeof voteSchema>;
