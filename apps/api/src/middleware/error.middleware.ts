import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse, ERROR_CODES } from '@blind/shared';
import config from '../config';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(error.message);
    });

    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid input.',
        details,
      },
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle unknown errors
  const statusCode = 500;
  const message = config.isDev ? err.message : 'A server error occurred.';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message,
    },
  });
};
