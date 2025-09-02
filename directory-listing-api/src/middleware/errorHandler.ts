import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
): void => {
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (error.message.includes('timeout')) {
    res.status(408).json({
      error: 'Request timeout',
      message: 'The operation took too long to complete'
    });
    return;
  }

  if (error.message.includes('memory')) {
    res.status(500).json({
      error: 'Server resource exceeded',
      message: 'The directory is too large to process'
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    message: `An unexpected error occurred: ${error.message}`
  });
};
