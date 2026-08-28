import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../../core/middleware/auth";
import { env } from "../../config/env";
import { ValidationError } from "../../core/errors";
import { assertCanAccess, getFileOrThrow, uploadFile } from "./files.service";
import { storageDriver } from "./storage";
import { recordAuditEvent } from "../audit/audit.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.files.maxSizeMb * 1024 * 1024 },
});

export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ValidationError("No file provided");

    const file = await uploadFile({
      ownerUserId: req.user!.sub,
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      entityType: typeof req.body.entityType === "string" ? req.body.entityType : undefined,
      entityId: typeof req.body.entityId === "string" ? req.body.entityId : undefined,
    });

    await recordAuditEvent({
      actorUserId: req.user!.sub,
      action: "file.uploaded",
      entityType: "file",
      entityId: file.id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      file: {
        id: file.id,
        originalName: file.original_name,
        mimeType: file.mime_type,
        sizeBytes: file.size_bytes,
        createdAt: file.created_at,
      },
    });
  }),
);

filesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const file = await getFileOrThrow(req.params.id);
    assertCanAccess(file, req.user!.sub);
    res.download(storageDriver.resolvePath(file.storage_key), file.original_name);
  }),
);
