import { z } from 'zod';

// Send message schema
export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z
    .string()
    .min(1, 'Please enter message content')
    .max(2000, 'Message cannot exceed 2,000 characters'),
  contextPostId: z.string().optional(), // Post that initiated the conversation
});

// Message query params schema
export const messageQuerySchema = z.object({
  conversationWith: z.string().optional(), // Filter by conversation partner
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
