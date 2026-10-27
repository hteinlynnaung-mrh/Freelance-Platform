import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUpRight, Check, ChevronRight, Sparkles, Users, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getProjects } from "../api/client";
import { demoProjects } from "../api/demo";
import { SearchIcon } from "../components/AppShell";
import { ProjectCard } from "../components/ProjectCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { localizeCategory } from "../i18n/categories";
import { useI18n } from "../i18n/I18nProvider";

const fallbackCategories = ["Design & Creative", "Development", "Marketing", "Writing & Content"];

export function BilingualHomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [pageSize, setPageSize] = useState(6);
  const isShowingAll = pageSize > 6;
  useEffect(() => {
    if (window.location.hash !== "#projects") return;
    setSearch("");
    setCurrency("");
    setActiveCategory("");
    setPageSize(6);
    const frame = window.requestAnimationFrame(() => document.getElementById("projects")?.scrollIntoView({ behavior: "auto", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const applyPopularSearch = (value: string) => {
    setSearch(value);
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  };
  const categories = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const query = useMemo(() => { const params = new URLSearchParams({ page: "1", pageSize: String(pageSize) }); if (search.trim()) params.set("q", search.trim()); if (currency) params.set("currency", currency); if (activeCategory) params.set("categoryId", activeCategory); return `?${params.toString()}`; }, [search, currency, activeCategory, pageSize]);
  const projects = useQuery({ queryKey: ["projects", query], queryFn: () => getProjects(query) });
  const categoryItems = categories.data?.data ?? [];
  const categoryOptions = categoryItems.length ? categoryItems.slice(0, 4).map((category) => ({ ...category, name: localizeCategory(category.name, t) })) : fallbackCategories.map((name) => ({ id: name, name: localizeCategory(name, t) }));
  const visibleProjects = projects.data?.data ?? (projects.isError ? demoProjects.data : []);

  return <>
    <section className="hero"><div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-inner"><div className="eyebrow"><span className="eyebrow-dot" />{t("futureOfIndependentWork")}</div><h1>{t("goodWorkStarts")}<br /><em>{t("withTheRightPeople")}</em></h1><p className="hero-copy">{t("heroCopy")}</p><form className="hero-search" onSubmit={(event) => { event.preventDefault(); document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }); }}><SearchIcon /><Input className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchProjects")} /><Button type="submit">{t("searchProjects")} <ArrowUpRight size={16} /></Button></form><div className="popular-searches"><span>{t("popular")}</span><Button variant="link" size="sm" className="h-auto border-0 p-0 text-[11px] text-inherit" onClick={() => applyPopularSearch("branding")}>{t("brandIdentity")}</Button><Button variant="link" size="sm" className="h-auto border-0 p-0 text-[11px] text-inherit" onClick={() => applyPopularSearch("web")}>{t("websiteDesign")}</Button><Button variant="link" size="sm" className="h-auto border-0 p-0 text-[11px] text-inherit" onClick={() => applyPopularSearch("content")}>{t("contentWriting")}</Button></div></div><div className="hero-note"><span>↓</span><span>{t("scrollToExplore")}</span></div></section>
    <section className="trust-strip"><div><strong>{t("builtForMeaningfulWork")}</strong><span>{t("thoughtfullyMatched")}</span></div><div className="trust-stats"><span><strong>10k+</strong>{t("talents")}</span><span><strong>4.9/5</strong>{t("averageRating")}</span><span><strong>48h</strong>{t("firstMatch")}</span></div></section>
    <section className="section projects-section" id="projects"><div className="section-heading"><div><div className="eyebrow dark"><span className="eyebrow-dot" />{t("exploreMarketplace")}</div><h2>{t("findNext")}<br /><em>{t("greatCollaboration")}</em></h2></div><p>{t("marketplaceCopy")}</p></div><div className="mb-6"><Separator className="mb-4" /><div className="flex items-center justify-between gap-4"><div className="filter-categories"><Button variant={activeCategory === "" ? "secondary" : "ghost"} size="sm" className="filter-pill h-8 rounded-full px-3" onClick={() => setActiveCategory("")}>{t("allProjects")}</Button>{categoryOptions.map((category) => <Button key={category.id} variant={activeCategory === category.id ? "secondary" : "ghost"} size="sm" className="filter-pill h-8 rounded-full px-3" onClick={() => { if (categoryItems.length) setActiveCategory(category.id); }}>{category.name}</Button>)}</div><label className="select-wrap">{t("currency")} <select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="">{t("allCurrencies")}</option><option value="USD">USD — US Dollar</option><option value="JPY">JPY — Japanese Yen</option></select><ArrowDown size={14} /></label></div><Separator className="mt-4" /></div>{projects.isLoading ? <div className="loading-grid">{[1, 2, 3].map((item) => <div className="skeleton" key={item} />)}</div> : <>{projects.isError && <Card className="connection-banner border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-none"><div><strong>{t("apiOffline")}</strong><span>{t("apiUnavailable")} {t("startApi")}</span></div><Button variant="outline" size="sm" onClick={() => projects.refetch()}>{t("retryConnection")}</Button></Card>}<div className="project-grid">{visibleProjects.map((project, index) => <ProjectCard key={project.id} project={project} featured={index === 0} />)}</div>{!visibleProjects.length && <div className="empty-state"><h3>{t("projectNotFound")}</h3><p>{t("tryAnotherSearch")}</p></div>}</>}{projects.data?.meta && <div className="results-footer"><span>{t("showProjects", { count: projects.data.data.length, total: projects.data.meta.total })}</span>{projects.data.meta.total > 6 && <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setPageSize(isShowingAll ? 6 : Math.min(projects.data?.meta.total ?? 20, 50))}>{isShowingAll ? t("viewLess") : t("viewAllProjects")} <ChevronRight size={16} /></Button>}</div>}</section>
    <section className="section how-section" id="how-it-works"><div className="how-copy"><div className="eyebrow dark"><span className="eyebrow-dot" />{t("betterWayToWork")}</div><h2>{t("moreThan")}<br /><em>{t("marketplace")}</em></h2><p>{t("betterWayCopy")}</p><Button variant="secondary" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>{t("learnHowItWorks")} <ArrowUpRight size={16} /></Button></div><div className="principles"><div className="principle"><span className="principle-icon"><Sparkles size={20} /></span><div><h3>{t("qualityTitle")}</h3><p>{t("qualityCopy")}</p></div></div><div className="principle"><span className="principle-icon"><Users size={20} /></span><div><h3>{t("peopleTitle")}</h3><p>{t("peopleCopy")}</p></div></div><div className="principle"><span className="principle-icon"><Zap size={20} /></span><div><h3>{t("momentumTitle")}</h3><p>{t("momentumCopy")}</p></div></div></div></section>
    <section className="cta-section" id="talent"><div><span className="eyebrow"><span className="eyebrow-dot" />{t("readyWhenYouAre")}</span><h2>{t("bringNextIdea")}<br /><em>{t("toLifeWithArcher")}</em></h2></div><div className="cta-actions"><p>{t("ctaCopy")}</p><Button onClick={() => navigate("/register")}>{t("getStarted")} <ArrowUpRight size={16} /></Button><span className="cta-check"><Check size={15} />{t("noPayment")}</span></div></section>
  </>;
}
