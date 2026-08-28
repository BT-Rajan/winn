import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../../core/middleware/auth";
import { listNotifications, markNotificationRead } from "./notifications.service";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await listNotifications(req.user!.sub);
    res.json({ notifications });
  }),
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    await markNotificationRead(req.user!.sub, req.params.id);
    res.status(204).send();
  }),
);
