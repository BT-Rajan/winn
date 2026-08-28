import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas";
import { login, logout, refresh, register } from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const result = await register(input, req.ip);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await login(input, req.ip);
    res.status(200).json(result);
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refresh(refreshToken);
    res.status(200).json(result);
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    await logout(refreshToken);
    res.status(204).send();
  }),
);
