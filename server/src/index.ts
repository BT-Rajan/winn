import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requestId } from "./core/middleware/requestId";
import { errorHandler, notFoundHandler } from "./core/middleware/errorHandler";
import { apiRouter } from "./api/router";
import { logger } from "./core/logger";

const app = express();

app.use(requestId);
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`Winn API listening on port ${env.port}`, { env: env.nodeEnv });
});
