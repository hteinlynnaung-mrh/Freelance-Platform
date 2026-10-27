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
