import { z } from 'zod';

// Create comment schema
export const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  parentId: z.string().optional(), // For replies
  content: z
    .string()
    .min(1, 'Please enter comment content')
    .max(2000, 'Comment cannot exceed 2,000 characters'),
  isAnonymous: z.boolean().default(true),
});

// Update comment schema
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Please enter comment content')
    .max(2000, 'Comment cannot exceed 2,000 characters'),
});

// Comment query params schema
export const commentQuerySchema = z.object({
  postId: z.string(),
  sort: z.enum(['oldest', 'newest', 'popular']).default('oldest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
