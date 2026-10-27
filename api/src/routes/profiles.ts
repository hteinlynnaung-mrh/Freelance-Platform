import { Router } from "express";
import { z } from "zod";
import { forbidden, notFound } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const currency = z.enum(["USD", "JPY"]);
const clientProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  company: z.string().trim().max(120).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  timezone: z.string().trim().max(80).nullable().optional()
});
const freelancerProfileSchema = clientProfileSchema.extend({
  headline: z.string().trim().max(140).nullable().optional(),
  hourlyRateMinor: z.number().int().nonnegative().nullable().optional(),
  currency: currency.nullable().optional(),
  availability: z.string().trim().max(40).nullable().optional(),
  experienceLevel: z.string().trim().max(40).nullable().optional()
});
const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  skillId: z.string().cuid().optional(),
  location: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20)
});

export const profilesRouter = Router();

profilesRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId }, include: { clientProfile: true, freelancerProfile: { include: { skills: { include: { skill: true } }, portfolioItems: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } } } } });
    if (!user) throw notFound("User profile not found");
    res.json({ data: { id: user.id, email: user.email, role: user.role, status: user.status, clientProfile: user.clientProfile, freelancerProfile: user.freelancerProfile } });
  } catch (error) {
    next(error);
  }
});

profilesRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role === "CLIENT") {
      const input = clientProfileSchema.parse(req.body);
      const profile = await prisma.clientProfile.update({ where: { userId: req.auth!.userId }, data: input });
      res.json({ data: profile });
      return;
    }
    if (req.auth!.role === "FREELANCER") {
      const input = freelancerProfileSchema.parse(req.body);
      const profile = await prisma.freelancerProfile.update({ where: { userId: req.auth!.userId }, data: input });
      res.json({ data: profile });
      return;
    }
    throw forbidden("Administrators do not have a marketplace profile");
  } catch (error) {
    next(error);
  }
});

profilesRouter.get("/freelancers", async (req, res, next) => {
  try {
    const input = listSchema.parse(req.query);
    const where = {
      user: { status: "ACTIVE" },
      ...(input.skillId ? { skills: { some: { skillId: input.skillId } } } : {}),
      ...(input.location ? { location: { contains: input.location } } : {}),
      ...(input.q ? { OR: [{ displayName: { contains: input.q } }, { headline: { contains: input.q } }, { bio: { contains: input.q } }] } : {})
    };
    const [items, total] = await prisma.$transaction([
      prisma.freelancerProfile.findMany({ where, include: { skills: { include: { skill: true } }, portfolioItems: { where: { isVisible: true }, orderBy: { sortOrder: "asc" }, take: 3 } }, orderBy: { updatedAt: "desc" }, skip: (input.page - 1) * input.pageSize, take: input.pageSize }),
      prisma.freelancerProfile.count({ where })
    ]);
    res.json({ data: items, meta: { page: input.page, pageSize: input.pageSize, total, pageCount: Math.ceil(total / input.pageSize) } });
  } catch (error) {
    next(error);
  }
});

profilesRouter.get("/freelancers/:id", async (req, res, next) => {
  try {
    const profile = await prisma.freelancerProfile.findFirst({ where: { userId: String(req.params.id), user: { status: "ACTIVE" } }, include: { skills: { include: { skill: true } }, portfolioItems: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } } });
    if (!profile) throw notFound("Freelancer profile not found");
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});
