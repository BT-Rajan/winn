import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors";
import { logger } from "../logger";

/**
 * The one place API errors are formatted. Modules throw AppError
 * subclasses (or let a ZodError bubble up) and never write res.json
 * for an error case themselves.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { requestId: req.requestId, code: err.code });
    }
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details ?? null },
      requestId: req.requestId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.flatten() },
      requestId: req.requestId,
    });
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", { requestId: req.requestId, message });

  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again.", details: null },
    requestId: req.requestId,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}`, details: null },
    requestId: req.requestId,
  });
}
