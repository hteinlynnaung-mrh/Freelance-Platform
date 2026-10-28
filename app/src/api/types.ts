export type Currency = "USD" | "JPY";
export type BudgetType = "FIXED" | "HOURLY";

export interface Category { id: string; name: string; slug?: string; }
export interface SkillLink { skill: { id: string; name: string; slug: string }; }
export interface Project {
  id: string; title: string; slug: string; description: string; budgetMinor: number;
  currency: Currency; budgetType: BudgetType; deadline: string | null;
  publishedAt: string | null; createdAt: string; category: Category | null; skills: SkillLink[];
}
export interface PagedProjects { data: Project[]; meta: { page: number; pageSize: number; total: number; pageCount: number }; }
export interface ApiEnvelope<T> { data: T; }

export type ProposalStatus = "SUBMITTED" | "SHORTLISTED" | "REJECTED" | "WITHDRAWN" | "ACCEPTED";

export interface ProposalProject {
  id: string; title: string; slug: string; description: string;
  currency: Currency; budgetMinor: number; budgetType: BudgetType; status: string;
  category: Category | null;
}

export interface Proposal {
  id: string; projectId: string; freelancerId: string; coverLetter: string;
  proposedAmountMinor: number; currency: Currency; estimatedDurationDays: number | null;
  status: ProposalStatus; createdAt: string; updatedAt: string; project: ProposalProject;
}

export interface SubmitProposalInput {
  coverLetter: string; proposedAmountMinor: number; currency: Currency; estimatedDurationDays?: number;
}
