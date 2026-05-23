import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const isDev = process.env.NODE_ENV !== "production";
  const message = err instanceof Error ? err.message : "Internal server error";
  const status = (err as any)?.status ?? (err as any)?.statusCode ?? 500;

  logger.error({ err, url: req.url, method: req.method }, message);

  res.status(status).json({
    error: message,
    ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
  });
}
