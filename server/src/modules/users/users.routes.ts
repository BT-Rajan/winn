import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../../core/middleware/auth";
import { NotFoundError } from "../../core/errors";
import { findUserById, getRolesForUser } from "./users.repository";

export const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.user!.sub);
    if (!user) throw new NotFoundError("User");
    const roles = await getRolesForUser(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        status: user.status,
        roles,
        createdAt: user.created_at,
      },
    });
  }),
);
