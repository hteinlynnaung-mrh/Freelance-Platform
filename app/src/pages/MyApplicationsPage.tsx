import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getMyProposals } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { formatMoney } from "../lib/money";
import { proposalStatusKeys } from "../lib/proposals";
import { useI18n } from "../i18n/I18nProvider";
import { localizeCategory } from "../i18n/categories";

export function MyApplicationsPage() {
  const { t, locale } = useI18n();
  const { user: account } = useAuth();
  const proposals = useQuery({
    queryKey: ["proposals", "mine"],
    queryFn: getMyProposals,
    enabled: account?.role === "FREELANCER",
  });

  // ProtectedRoute already enforces auth + role; this is a safety net
  const isFreelancer = account?.role === "FREELANCER";

  return (
    <div className="applications-page">
      <div className="applications-inner">
        <Button asChild variant="outline" size="sm" className="detail-back-button">
          <Link to="/projects#projects"><ArrowLeft size={16} />{t("backToProjects")}</Link>
        </Button>
        <div className="applications-header">
          <div>
            <div className="eyebrow dark"><span className="eyebrow-dot" />{t("accountEyebrow")}</div>
            <h1>{t("myApplications")}</h1>
            <p>{t("applicationsCopy")}</p>
          </div>
          <Button asChild className="applications-browse">
            <Link to="/projects#projects">{t("browseProjects")} <ArrowUpRight size={16} /></Link>
          </Button>
        </div>

        {!isFreelancer ? (
          <div className="empty-state">
            <h3>{t("myApplications")}</h3>
            <p>{t("onlyFreelancersCanApply")}</p>
          </div>
        ) : proposals.isLoading ? (
          <p className="applications-state">{t("loading")}</p>
        ) : proposals.isError ? (
          <div className="empty-state">
            <h3>{t("apiUnavailable")}</h3>
            <Button variant="outline" size="sm" onClick={() => proposals.refetch()}>{t("retryConnection")}</Button>
          </div>
        ) : proposals.data && proposals.data.data.length > 0 ? (
          <div className="application-list">
            {proposals.data.data.map((proposal) => (
              <article key={proposal.id} className="application-card">
                <div className="application-main">
                  <div className="application-title">
                    {proposal.project.status === "PUBLISHED"
                      ? <Link to={`/projects/${proposal.project.id}`}>{proposal.project.title}</Link>
                      : <span>{proposal.project.title}</span>}
                  </div>
                  <div className="application-meta">
                    <span>{proposal.project.category ? localizeCategory(proposal.project.category.name, t) : t("independent")}</span>
                    <span>{t("appliedOn", { date: new Date(proposal.createdAt).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) })}</span>
                  </div>
                </div>
                <div className="application-side">
                  <span className={`status-badge status-${proposal.status.toLowerCase()}`}>{t(proposalStatusKeys[proposal.status])}</span>
                  <strong>{formatMoney(proposal.proposedAmountMinor, proposal.currency, locale)}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>{t("noApplications")}</h3>
            <p>{t("noApplicationsCopy")}</p>
            <Button asChild className="applications-browse">
              <Link to="/projects#projects">{t("browseProjects")} <ArrowUpRight size={16} /></Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
