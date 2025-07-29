import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      details: `Cannot ${req.method} ${req.path}`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  });
};
