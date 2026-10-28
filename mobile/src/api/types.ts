export type Currency = 'USD' | 'JPY';
export type BudgetType = 'FIXED' | 'HOURLY';
export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN';
export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'ARCHIVED';
export type ProposalStatus = 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN' | 'ACCEPTED';
export type EngagementStatus = 'ACTIVE' | 'SUBMITTED_FOR_REVIEW' | 'COMPLETED' | 'CANCELLED';

export interface ApiEnvelope<T> { data: T; }
export interface PageMeta { page: number; pageSize: number; total: number; pageCount: number; }
export interface PagedEnvelope<T> { data: T[]; meta: PageMeta; }

export interface ApiError { error: { code: string; message: string; details?: unknown } }

export interface Category { id: string; name: string; slug: string; description?: string | null; }
export interface Skill { id: string; name: string; slug: string; }
export interface SkillLink { skill: Skill; }

export interface ClientProfile {
  id: string; userId: string; displayName: string; company?: string | null;
  avatarUrl?: string | null; bio?: string | null; location?: string | null; timezone?: string | null;
}
export interface FreelancerProfile {
  id: string; userId: string; displayName: string; headline?: string | null;
  bio?: string | null; avatarUrl?: string | null; location?: string | null; timezone?: string | null;
  hourlyRateMinor?: number | null; currency?: Currency | null;
  availability?: string | null; experienceLevel?: string | null;
  skills: { skill: Skill; proficiency?: string | null }[];
  portfolioItems: PortfolioItem[];
}
export interface PortfolioItem {
  id: string; title: string; description?: string | null; externalUrl?: string | null;
  sortOrder: number; isVisible: boolean;
}

export interface User {
  id: string; email: string; username?: string | null; role: UserRole; status: string;
  clientProfile?: ClientProfile | null;
  freelancerProfile?: FreelancerProfile | null;
}

export interface Project {
  id: string; ownerId: string; categoryId?: string | null;
  title: string; slug: string; description: string;
  budgetMinor: number; currency: Currency; budgetType: BudgetType;
  status: ProjectStatus; deadline?: string | null;
  publishedAt?: string | null; createdAt: string; updatedAt: string;
  category?: Category | null;
  skills: SkillLink[];
  owner?: { id: string; clientProfile?: ClientProfile | null };
}

export interface Proposal {
  id: string; projectId: string; freelancerId: string;
  coverLetter: string; proposedAmountMinor: number; currency: Currency;
  estimatedDurationDays?: number | null; status: ProposalStatus;
  createdAt: string; updatedAt: string;
  project: Pick<Project, 'id' | 'title' | 'slug' | 'category' | 'status'>;
  freelancer: { id: string; email: string; freelancerProfile?: Pick<FreelancerProfile, 'displayName' | 'headline' | 'avatarUrl' | 'skills'> | null };
}

export interface Engagement {
  id: string; projectId: string; proposalId: string;
  clientId: string; freelancerId: string; status: EngagementStatus;
  startDate?: string | null; targetCompletionDate?: string | null; completedAt?: string | null;
  createdAt: string; updatedAt: string;
  project: Pick<Project, 'id' | 'title' | 'category'>;
  proposal: Pick<Proposal, 'id' | 'proposedAmountMinor' | 'currency' | 'estimatedDurationDays'>;
  client: { id: string; email: string; clientProfile?: Pick<ClientProfile, 'displayName' | 'avatarUrl'> | null };
  freelancer: { id: string; email: string; freelancerProfile?: Pick<FreelancerProfile, 'displayName' | 'avatarUrl'> | null };
}

export interface ConversationParticipant {
  conversationId: string; userId: string; joinedAt: string;
  user: { id: string; email: string; clientProfile?: Pick<ClientProfile, 'displayName' | 'avatarUrl'> | null; freelancerProfile?: Pick<FreelancerProfile, 'displayName' | 'avatarUrl'> | null };
}
export interface Message {
  id: string; conversationId: string; senderId: string;
  body: string; readAt?: string | null; createdAt: string;
  sender: ConversationParticipant['user'];
}
export interface Conversation {
  id: string; status: string; createdAt: string; updatedAt: string;
  participants: ConversationParticipant[];
  messages: Message[];
}

export interface Notification {
  id: string; userId: string; type: string; title: string; body: string;
  resourceType?: string | null; resourceId?: string | null;
  readAt?: string | null; createdAt: string;
}

export interface Review {
  id: string; engagementId: string; authorId: string; subjectId: string;
  rating: number; comment?: string | null; isVisible: boolean; createdAt: string;
  author: { id: string; email: string };
  subject?: { id: string; email: string };
}
