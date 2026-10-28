import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, DollarSign, MapPin } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMyProposals, getProject, submitProposal } from "../api/client";
import { useAccount } from "../auth/useAccount";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatMoney, toMinorUnits } from "../lib/money";
import { proposalStatusKeys } from "../lib/proposals";
import { useI18n } from "../i18n/I18nProvider";
import { localizeCategory } from "../i18n/categories";

export function BilingualProjectDetailPage() {
  const { t, locale } = useI18n();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const account = useAccount();

  const project = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });
  const myProposals = useQuery({
    queryKey: ["proposals", "mine"],
    queryFn: getMyProposals,
    enabled: account?.role === "FREELANCER",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [amount, setAmount] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [applyError, setApplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFormOpen(false);
    setApplyError("");
    setSubmitted(false);
  }, [id]);

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
  const existingProposal = myProposals.data?.data.find((proposal) => proposal.projectId === item.id);
  const hasActiveProposal = Boolean(existingProposal && existingProposal.status !== "WITHDRAWN");

  function openApplyForm() {
    setAmount(String(item.budgetMinor / 100));
    setFormOpen(true);
    setApplyError("");
  }

  async function submitApplication(event: React.FormEvent) {
    event.preventDefault();
    setApplyError("");
    const proposedAmount = Number(amount);
    if (!Number.isFinite(proposedAmount) || proposedAmount <= 0) {
      setApplyError(t("amountRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await submitProposal(item.id, {
        coverLetter: coverLetter.trim(),
        proposedAmountMinor: toMinorUnits(proposedAmount),
        currency: item.currency,
        ...(durationDays ? { estimatedDurationDays: Number(durationDays) } : {}),
      });
      setFormOpen(false);
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: ["proposals", "mine"] });
    } catch (reason) {
      setApplyError(reason instanceof Error ? reason.message : t("somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

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
              <strong>{formatMoney(item.budgetMinor, item.currency, locale)}</strong>
              <span>{item.budgetType === "HOURLY" ? t("perHour") : t("fixedPrice")}</span>
              <div className="brief-row"><DollarSign size={17} /><div><small>{t("currency")}</small><b>{item.currency}</b></div></div>
              <div className="brief-row"><Clock3 size={17} /><div><small>{t("timeline")}</small><b>{item.deadline ? t("due", { date: new Date(item.deadline).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) }) : t("flexible")}</b></div></div>
              <div className="brief-row"><MapPin size={17} /><div><small>{t("workStyle")}</small><b>{t("remote")}</b></div></div>

              {!account ? (
                <Button className="full-button" onClick={() => navigate(`/login?next=${encodeURIComponent(`/projects/${item.id}`)}`)}>
                  {t("signInToApply")} <ArrowUpRight size={16} />
                </Button>
              ) : account.role !== "FREELANCER" ? (
                <p className="sidebar-note">{t("onlyFreelancersCanApply")}</p>
              ) : submitted ? (
                <div className="apply-status">
                  <p className="apply-success">{t("proposalSubmitted")}</p>
                  <Link to="/account/applications" className="apply-link">{t("viewMyApplications")}</Link>
                </div>
              ) : hasActiveProposal && existingProposal ? (
                <div className="apply-status">
                  <span className={`status-badge status-${existingProposal.status.toLowerCase()}`}>{t(proposalStatusKeys[existingProposal.status])}</span>
                  <small>{t("appliedOn", { date: new Date(existingProposal.createdAt).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) })}</small>
                  <Link to="/account/applications" className="apply-link">{t("viewMyApplications")}</Link>
                </div>
              ) : formOpen ? (
                <form className="apply-form" onSubmit={submitApplication}>
                  <div className="apply-form-head">
                    <strong>{t("applyTitle")}</strong>
                    <button type="button" className="apply-cancel" onClick={() => setFormOpen(false)}>{t("cancel")}</button>
                  </div>
                  <label>
                    {t("coverLetter")}
                    <textarea
                      value={coverLetter}
                      onChange={(event) => setCoverLetter(event.target.value)}
                      required
                      minLength={20}
                      maxLength={10000}
                      rows={5}
                      placeholder={t("coverLetterPlaceholder")}
                    />
                  </label>
                  <label>
                    {t("proposedAmountIn", { currency: item.currency })}
                    <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} required min={1} step={1} inputMode="numeric" />
                  </label>
                  <label>
                    {t("estimatedDurationDays")}
                    <input type="number" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} min={1} max={3650} step={1} inputMode="numeric" placeholder={t("optional")} />
                  </label>
                  {applyError && <div className="form-error">{applyError}</div>}
                  <Button type="submit" className="full-button" disabled={submitting}>
                    {submitting ? t("loading") : t("submitProposal")} <ArrowUpRight size={16} />
                  </Button>
                </form>
              ) : (
                <Button className="full-button" onClick={openApplyForm}>{t("applyProject")} <ArrowUpRight size={16} /></Button>
              )}

              <p className="sidebar-note"><CalendarDays size={14} /> {t("noPaymentCollected")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
