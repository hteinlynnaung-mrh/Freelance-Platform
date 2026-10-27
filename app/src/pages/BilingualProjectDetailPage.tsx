import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, DollarSign, MapPin } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProject } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useI18n } from "../i18n/I18nProvider";
import { localizeCategory } from "../i18n/categories";

export function BilingualProjectDetailPage() {
  const { t, locale } = useI18n();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const project = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });

  if (project.isLoading) return <div className="detail-state">{t("loadingProject")}</div>;

  if (project.isError || !project.data) {
    return (
      <div className="detail-state">
        <h2>{t("projectNotFound")}</h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/projects#projects"><ArrowLeft size={16} />{t("backToProjects")}</Link>
        </Button>
      </div>
    );
  }

  const item = project.data.data;
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(item.budgetMinor / 100);

  return (
    <div className="detail-page">
      <div className="detail-inner">
        <Button asChild variant="outline" size="sm" className="detail-back-button">
          <Link to="/projects#projects"><ArrowLeft size={16} />{t("backToProjects")}</Link>
        </Button>
        <div className="detail-layout">
          <article className="detail-main">
            <div className="eyebrow dark"><span className="eyebrow-dot" />{t("projectBrief")}</div>
            <h1>{item.title}</h1>
            <div className="detail-tags">
              <Badge>{item.category ? localizeCategory(item.category.name, t) : t("independent")}</Badge>
              {item.skills.map(({ skill }) => <span key={skill.id}>{skill.name}</span>)}
            </div>
            <div className="detail-divider" />
            <h2>{t("aboutProject")}</h2>
            <p className="detail-description">{item.description}</p>
            <h2>{t("whatYouWorkOn")}</h2>
            <ul className="detail-list">
              <li><CheckCircle2 size={18} />{t("workPointOne")}</li>
              <li><CheckCircle2 size={18} />{t("workPointTwo")}</li>
              <li><CheckCircle2 size={18} />{t("workPointThree")}</li>
            </ul>
          </article>
          <aside className="detail-sidebar">
            <div className="brief-card">
              <div className="brief-label">{t("projectBudget")}</div>
              <strong>{amount}</strong>
              <span>{item.budgetType === "HOURLY" ? t("perHour") : t("fixedPrice")}</span>
              <div className="brief-row"><DollarSign size={17} /><div><small>{t("currency")}</small><b>{item.currency}</b></div></div>
              <div className="brief-row"><Clock3 size={17} /><div><small>{t("timeline")}</small><b>{item.deadline ? t("due", { date: new Date(item.deadline).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) }) : t("flexible")}</b></div></div>
              <div className="brief-row"><MapPin size={17} /><div><small>{t("workStyle")}</small><b>{t("remote")}</b></div></div>
              <Button className="full-button" onClick={() => navigate(`/login?next=${encodeURIComponent(`/projects/${item.id}`)}`)}>{t("applyProject")} <ArrowUpRight size={16} /></Button>
              <p className="sidebar-note"><CalendarDays size={14} /> {t("noPaymentCollected")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
