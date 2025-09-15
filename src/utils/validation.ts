import { z } from 'zod';

// User validation schemas
export const registerUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(email => email.trim()),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
});

export const loginUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(email => email.trim()),

  password: z
    .string()
    .min(1, 'Password is required')
});

// Poll validation schemas
export const createPollSchema = z.object({
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(500, 'Question must not exceed 500 characters')
    .trim(),

  options: z
    .array(z.object({
      text: z
        .string()
        .min(1, 'Option text is required')
        .max(200, 'Option text must not exceed 200 characters')
        .trim()
    }))
    .min(2, 'Poll must have at least 2 options')
    .max(10, 'Poll cannot have more than 10 options'),

  isPublished: z.boolean().optional().default(false)
});

export const updatePollSchema = z.object({
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(500, 'Question must not exceed 500 characters')
    .trim()
    .optional(),

  isPublished: z.boolean().optional()
});

// Vote validation schemas
export const submitVoteSchema = z.object({
  pollOptionId: z
    .string()
    .min(1, 'Poll option ID is required')
});

// Parameter validation schemas
export const pollIdSchema = z.object({
  id: z.string().min(1, 'Poll ID is required')
});

export const userIdSchema = z.object({
  id: z.string().min(1, 'User ID is required')
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val > 0, 'Page must be greater than 0'),

  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 10)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
});

export const pollQuerySchema = z.object({
  published: z
    .string()
    .optional()
    .transform(val => val === 'true'),

  creator: z
    .string()
    .optional(),

  search: z
    .string()
    .optional()
    .transform(val => val?.trim())
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Export type definitions
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type PollQueryInput = z.infer<typeof pollQuerySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
