import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { conflict, forbidden, notFound, badRequest } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const proposalSchema = z.object({
  coverLetter: z.string().trim().min(20).max(10000),
  proposedAmountMinor: z.number().int().nonnegative(),
  currency: z.enum(["USD", "JPY"]),
  estimatedDurationDays: z.number().int().positive().max(3650).optional()
});

const proposalInclude = {
  project: { include: { category: true } },
  freelancer: { select: { id: true, email: true, freelancerProfile: { include: { skills: { include: { skill: true } } } } } }
} as const;

const loadProposal = (id: string) => prisma.proposal.findUnique({ where: { id }, include: proposalInclude });

export const proposalsRouter = Router();

proposalsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const where = req.auth!.role === "FREELANCER"
      ? { freelancerId: req.auth!.userId }
      : req.auth!.role === "CLIENT"
        ? { project: { ownerId: req.auth!.userId } }
        : {};
    const proposals = await prisma.proposal.findMany({ where, include: proposalInclude, orderBy: { createdAt: "desc" } });
    res.json({ data: proposals });
  } catch (error) {
    next(error);
  }
});

proposalsRouter.post("/projects/:projectId", requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role !== "FREELANCER") throw forbidden("Only freelancers can submit proposals");
    const input = proposalSchema.parse(req.body);
    const project = await prisma.project.findUnique({ where: { id: String(req.params.projectId) } });
    if (!project || project.status !== "PUBLISHED") throw notFound("Published project not found");
    if (project.ownerId === req.auth!.userId) throw forbidden("You cannot submit a proposal to your own project");
    if (input.currency !== project.currency) throw badRequest("Proposal currency must match the project currency");
    const existing = await prisma.proposal.findUnique({ where: { projectId_freelancerId: { projectId: project.id, freelancerId: req.auth!.userId } } });
    if (existing && existing.status !== "WITHDRAWN") throw conflict("You already have an active proposal for this project");

    const proposal = existing
      ? await prisma.proposal.update({ where: { id: existing.id }, data: { coverLetter: input.coverLetter, proposedAmountMinor: input.proposedAmountMinor, currency: input.currency, estimatedDurationDays: input.estimatedDurationDays, status: "SUBMITTED" }, include: proposalInclude })
      : await prisma.proposal.create({ data: { projectId: project.id, freelancerId: req.auth!.userId, coverLetter: input.coverLetter, proposedAmountMinor: input.proposedAmountMinor, currency: input.currency, estimatedDurationDays: input.estimatedDurationDays }, include: proposalInclude });
    res.status(existing ? 200 : 201).json({ data: proposal });
  } catch (error) {
    next(error);
  }
});

proposalsRouter.post("/:id/withdraw", requireAuth, async (req, res, next) => {
  try {
    const proposal = await loadProposal(String(req.params.id));
    if (!proposal) throw notFound("Proposal not found");
    if (req.auth!.role !== "FREELANCER" || proposal.freelancerId !== req.auth!.userId) throw forbidden();
    if (!["SUBMITTED", "SHORTLISTED"].includes(proposal.status)) throw badRequest("This proposal cannot be withdrawn");
    const updated = await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "WITHDRAWN" }, include: proposalInclude });
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

const clientProposalAction = (action: "SHORTLISTED" | "REJECTED") => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await loadProposal(String(req.params.id));
    if (!proposal) throw notFound("Proposal not found");
    if (req.auth!.role !== "CLIENT" || proposal.project.ownerId !== req.auth!.userId) throw forbidden();
    if (!["SUBMITTED", "SHORTLISTED"].includes(proposal.status)) throw badRequest("This proposal is no longer actionable");
    const updated = await prisma.proposal.update({ where: { id: proposal.id }, data: { status: action }, include: proposalInclude });
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

proposalsRouter.post("/:id/shortlist", requireAuth, clientProposalAction("SHORTLISTED"));
proposalsRouter.post("/:id/reject", requireAuth, clientProposalAction("REJECTED"));

proposalsRouter.post("/:id/accept", requireAuth, async (req, res, next) => {
  try {
    const proposal = await loadProposal(String(req.params.id));
    if (!proposal) throw notFound("Proposal not found");
    if (req.auth!.role !== "CLIENT" || proposal.project.ownerId !== req.auth!.userId) throw forbidden();
    if (!["SUBMITTED", "SHORTLISTED"].includes(proposal.status)) throw badRequest("This proposal cannot be accepted");
    if (proposal.project.status !== "PUBLISHED") throw badRequest("This project is no longer accepting proposals");

    const result = await prisma.$transaction(async (tx) => {
      const accepted = await tx.proposal.update({ where: { id: proposal.id }, data: { status: "ACCEPTED" } });
      await tx.proposal.updateMany({ where: { projectId: proposal.projectId, id: { not: proposal.id }, status: { in: ["SUBMITTED", "SHORTLISTED"] } }, data: { status: "REJECTED" } });
      const project = await tx.project.update({ where: { id: proposal.projectId }, data: { status: "IN_PROGRESS" } });
      const engagement = await tx.engagement.create({ data: { projectId: proposal.projectId, proposalId: proposal.id, clientId: proposal.project.ownerId, freelancerId: proposal.freelancerId, status: "ACTIVE", startDate: new Date() } });
      const conversation = await tx.conversation.create({ data: { participants: { create: [{ userId: proposal.project.ownerId }, { userId: proposal.freelancerId }] } } });
      await tx.notification.createMany({ data: [{ userId: proposal.freelancerId, type: "PROPOSAL_ACCEPTED", title: "Your proposal was accepted", body: `Your proposal for ${proposal.project.title} was accepted.`, resourceType: "ENGAGEMENT", resourceId: engagement.id }, { userId: proposal.project.ownerId, type: "ENGAGEMENT_CREATED", title: "Engagement created", body: `Your engagement for ${proposal.project.title} is ready to start.`, resourceType: "ENGAGEMENT", resourceId: engagement.id }] });
      return { accepted, project, engagement, conversation };
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});
