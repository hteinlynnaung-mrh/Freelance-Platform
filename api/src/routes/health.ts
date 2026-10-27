import { Router } from "express";
import { prisma } from "../prisma.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    data: {
      service: "archer-api",
      status: "ok",
      message: "Archer API is running",
      health: "/health",
      readiness: "/ready"
    }
  });
});

healthRouter.get("/health", (_req, res) => {
  res.json({ data: { service: "archer-api", status: "ok" } });
});

healthRouter.get("/ready", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { service: "archer-api", status: "ready", database: "ok" } });
  } catch (error) {
    next(error);
  }
});
