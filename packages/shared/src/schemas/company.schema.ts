import { z } from 'zod';

// Company query params schema
export const companyQuerySchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Create company review schema
export const createCompanyReviewSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  overallRating: z.number().int().min(1).max(5),
  salaryRating: z.number().int().min(1).max(5).optional(),
  workLifeRating: z.number().int().min(1).max(5).optional(),
  cultureRating: z.number().int().min(1).max(5).optional(),
  managementRating: z.number().int().min(1).max(5).optional(),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  pros: z
    .string()
    .min(20, 'Pros must be at least 20 characters')
    .max(2000, 'Pros cannot exceed 2,000 characters'),
  cons: z
    .string()
    .min(20, 'Cons must be at least 20 characters')
    .max(2000, 'Cons cannot exceed 2,000 characters'),
  advice: z
    .string()
    .max(2000, 'Advice to management cannot exceed 2,000 characters')
    .optional(),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  isCurrentEmployee: z.boolean().default(true),
  yearsAtCompany: z.number().int().min(0).max(50).optional(),
  isAnonymous: z.boolean().default(true),
});

export type CompanyQueryInput = z.infer<typeof companyQuerySchema>;
export type CreateCompanyReviewInput = z.infer<typeof createCompanyReviewSchema>;
