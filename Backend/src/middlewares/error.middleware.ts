// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
}
