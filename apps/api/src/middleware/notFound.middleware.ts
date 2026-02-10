import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ERROR_CODES } from '@blind/shared';

export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
};
