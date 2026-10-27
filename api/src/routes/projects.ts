import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { forbidden, notFound } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const currency = z.enum(["USD", "JPY"]);
const budgetType = z.enum(["FIXED", "HOURLY"]);
const createProjectSchema = z.object({
  title: z.string().trim().min(5).max(140),
  description: z.string().trim().min(20).max(10000),
  categoryId: z.string().cuid().optional(),
  skillIds: z.array(z.string().cuid()).max(20).default([]),
  budgetMinor: z.number().int().nonnegative(),
  currency,
  budgetType,
  deadline: z.coerce.date().optional()
});
const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.string().cuid().optional(),
  currency: currency.optional(),
  budgetType: budgetType.optional(),
  minBudgetMinor: z.coerce.number().int().nonnegative().optional(),
  maxBudgetMinor: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20)
});

const toSlug = (value: string) => `${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 8)}`;

export const projectsRouter = Router();

projectsRouter.get("/saved", requireAuth, async (req, res, next) => {
  try {
    const saved = await prisma.savedProject.findMany({ where: { userId: req.auth!.userId }, include: { project: { include: { category: true, skills: { include: { skill: true } } } } }, orderBy: { createdAt: "desc" } });
    res.json({ data: saved.map((item) => ({ ...item.project, savedAt: item.createdAt })) });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get("/", async (req, res, next) => {
  try {
    const input = listSchema.parse(req.query);
    const where = {
      status: "PUBLISHED",
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.budgetType ? { budgetType: input.budgetType } : {}),
      ...(input.minBudgetMinor !== undefined || input.maxBudgetMinor !== undefined
        ? { budgetMinor: { ...(input.minBudgetMinor !== undefined ? { gte: input.minBudgetMinor } : {}), ...(input.maxBudgetMinor !== undefined ? { lte: input.maxBudgetMinor } : {}) } }
        : {}),
      ...(input.q ? {
        OR: [
          { title: { contains: input.q } },
          { description: { contains: input.q } },
          { category: { name: { contains: input.q } } },
          { skills: { some: { skill: { name: { contains: input.q } } } } },
        ],
      } : {})
    };
    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({ where, include: { category: true, skills: { include: { skill: true } } }, orderBy: { publishedAt: "desc" }, skip: (input.page - 1) * input.pageSize, take: input.pageSize }),
      prisma.project.count({ where })
    ]);
    res.json({ data: items, meta: { page: input.page, pageSize: input.pageSize, total, pageCount: Math.ceil(total / input.pageSize) } });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get("/:id", async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const project = await prisma.project.findFirst({ where: { id: projectId, status: "PUBLISHED" }, include: { category: true, skills: { include: { skill: true } }, owner: { select: { id: true, clientProfile: true } } } });
    if (!project) throw notFound("Published project not found");
    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role !== "CLIENT" && req.auth!.role !== "ADMIN") throw forbidden("Only clients can create projects");
    const input = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({ data: { ownerId: req.auth!.userId, categoryId: input.categoryId, title: input.title, slug: toSlug(input.title), description: input.description, budgetMinor: input.budgetMinor, currency: input.currency, budgetType: input.budgetType, deadline: input.deadline, skills: input.skillIds.length ? { create: input.skillIds.map((skillId) => ({ skillId })) } : undefined }, include: { category: true, skills: { include: { skill: true } } } });
    res.status(201).json({ data: project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/:id/publish", requireAuth, async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw notFound("Project not found");
    if (req.auth!.role !== "ADMIN" && project.ownerId !== req.auth!.userId) throw forbidden();
    const updated = await prisma.project.update({ where: { id: project.id }, data: { status: "PUBLISHED", publishedAt: project.publishedAt ?? new Date() } });
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/:id/save", requireAuth, async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: String(req.params.id), status: "PUBLISHED" } });
    if (!project) throw notFound("Published project not found");
    const saved = await prisma.savedProject.upsert({ where: { userId_projectId: { userId: req.auth!.userId, projectId: project.id } }, update: {}, create: { userId: req.auth!.userId, projectId: project.id } });
    res.status(201).json({ data: saved });
  } catch (error) {
    next(error);
  }
});

projectsRouter.delete("/:id/save", requireAuth, async (req, res, next) => {
  try {
    await prisma.savedProject.deleteMany({ where: { userId: req.auth!.userId, projectId: String(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
