import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { useTheme } from "../theme/ThemeProvider";
import { ArcherMark } from "./ArcherMark";
import { Button } from "./ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user: account, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  async function handleSignOut() {
    await logout();
  }

  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <Link to="/" className="brand" aria-label="Archer home"><ArcherMark /><span>Archer</span></Link>
      <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
        <NavLink to="/projects" end>{t("findWork")}</NavLink>
        {account?.role === "FREELANCER" && <NavLink to="/account/applications">{t("myApplications")}</NavLink>}
        {account?.role === "CLIENT" && <NavLink to="/dashboard">{t("dashboard")}</NavLink>}
        <Link to="/#how-it-works">{t("howItWorks")}</Link>
        {account && <NavLink to="/account/settings">{t("accountSettings")}</NavLink>}
      </nav>
      <div className="header-actions">
        <Button variant="outline" size="icon-sm" className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")} title={theme === "dark" ? t("switchToLight") : t("switchToDark")}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </Button>
        <label className="language-switcher">
          <span>{t("language")}</span>
          <select aria-label={t("language")} value={language} onChange={(event) => setLanguage(event.target.value as "en" | "ja")}>
            <option value="en">{t("english")}</option>
            <option value="ja">{t("japanese")}</option>
          </select>
        </label>
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={t("toggleMenu")}><Menu size={20} /></button>
        {account ? <>
          <Link to="/account/settings" className="header-account" title={account.email}>{account.username ? `@${account.username}` : account.email}</Link>
          <button type="button" className="header-signout" onClick={handleSignOut}>{t("signOut")}</button>
        </> : <>
          <Link to="/login" className="header-login">{t("signIn")}</Link>
          <Link to="/register" className="button button-primary header-cta">{t("postProject")} <ArrowUpRight size={16} /></Link>
        </>}
      </div>
    </div></header>
    <main>{children}</main>
    <footer className="site-footer"><div className="footer-inner">
      <div><Link to="/" className="brand footer-brand"><ArcherMark size={24} /><span>Archer</span></Link><p>{t("footerTagline")}</p></div>
      <div className="footer-links"><Link to="/#how-it-works">{t("howItWorks")}</Link><Link to="/#talent">{t("findTalent")}</Link><Link to="/projects#projects">{t("exploreProjects")}</Link><Link to="/login">{t("signIn")}</Link></div>
      <small>© 2026 Archer. {t("builtForMeaningfulWork")}.</small>
    </div></footer>
  </div>;
}

export function SearchIcon() { return <Search size={18} strokeWidth={2.2} />; }
