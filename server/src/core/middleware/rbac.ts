import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors";

export type Role = "admin" | "customer" | "builder";

/**
 * Gate a route to one or more roles. A rule about who can do what is
 * expressed once, here, and referenced by every module — it is never
 * re-implemented ad hoc inside a controller.
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const hasRole = req.user.roles.some((role) => allowed.includes(role as Role));
    if (!hasRole) {
      throw new ForbiddenError();
    }
    next();
  };
}
