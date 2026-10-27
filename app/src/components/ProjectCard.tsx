import { ArrowUpRight, Bookmark, Clock3, DollarSign } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { getSavedProjects, saveProject, unsaveProject } from "../api/client";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";
import { localizeCategory } from "../i18n/categories";
import { useI18n } from "../i18n/I18nProvider";
import type { Project } from "../api/types";
const money = (amountMinor: number, currency: Project["currency"]) => new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(amountMinor / 100);
export function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(localStorage.getItem("archer_access_token"));
  const savedProjects = useQuery({ queryKey: ["saved-projects"], queryFn: getSavedProjects, enabled: isAuthenticated });
  const saved = savedProjects.data?.data.some((item) => item.id === project.id) ?? false;
  const saveMutation = useMutation({
    mutationFn: () => saved ? unsaveProject(project.id) : saveProject(project.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-projects"] }),
  });
  const handleSave = () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/projects/${project.id}`)}`);
      return;
    }
    saveMutation.mutate();
  };
  return <Card className={cn("project-card-shadcn min-h-[310px] border-border/70 bg-card/95 p-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl", featured && "featured-card-shadcn border-transparent bg-[var(--mint)]")}>
    <CardHeader className="gap-0 px-5 pb-0 pt-5">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary" className="rounded-full bg-primary/10 font-mono text-[10px] uppercase tracking-wide text-primary">{project.category ? localizeCategory(project.category.name, t) : t("independent")}</Badge>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-primary" aria-label={saved ? t("removeSavedProject") : t("saveProject")} aria-pressed={saved} aria-busy={saveMutation.isPending} disabled={saveMutation.isPending} onClick={handleSave}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></Button>
      </div>
      <CardTitle className="mt-6 text-xl leading-tight tracking-tight">
        <Link to={`/projects/${project.id}`} className="transition-colors hover:text-primary">{project.title}</Link>
      </CardTitle>
      <CardDescription className="mt-2 line-clamp-3 text-xs leading-relaxed">{project.description}</CardDescription>
    </CardHeader>
    <CardContent className="mt-auto px-5 pb-0">
      <div className="flex flex-wrap gap-1.5 pt-5">{project.skills.slice(0, 3).map(({ skill }) => <Badge key={skill.id} variant="outline" className="rounded-md px-2 py-1 text-[10px] font-normal text-muted-foreground">{skill.name}</Badge>)}</div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1">{project.currency === "USD" && <DollarSign size={14} />}{money(project.budgetMinor, project.currency)} {project.budgetType === "HOURLY" ? t("hourly") : t("fixed")}</span><span className="inline-flex items-center gap-1"><Clock3 size={14} />{project.deadline ? t("due", { date: new Date(project.deadline).toLocaleDateString(locale, { month: "short", day: "numeric" }) }) : t("flexibleTimeline")}</span></div>
    </CardContent>
    <CardFooter className="mx-5 mt-4 border-t border-border/70 px-0 py-4"><Button asChild variant="link" className="h-auto w-full justify-between px-0 text-xs font-semibold"><Link to={`/projects/${project.id}`}>{t("viewProject")} <ArrowUpRight size={16} /></Link></Button></CardFooter>
  </Card>;
}
