import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { usersRouter } from "../modules/users/users.routes";
import { notificationsRouter } from "../modules/notifications/notifications.routes";
import { filesRouter } from "../modules/files/files.routes";
import { projectsRouter } from "../modules/projects/projects.routes";
import { checkDbConnection } from "../db/pool";

export const apiRouter = Router();

apiRouter.get("/health", async (_req, res) => {
  const dbOk = await checkDbConnection();
  res.status(dbOk ? 200 : 503).json({ status: dbOk ? "ok" : "degraded", db: dbOk });
});

// Every experience (Customer UI, Builder UI, Admin UI) calls into these
// same module routes — nothing is duplicated per experience.
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/files", filesRouter);
apiRouter.use("/projects", projectsRouter);
