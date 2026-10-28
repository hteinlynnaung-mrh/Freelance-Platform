import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, Check, UserRound } from "lucide-react";
import { ArcherMark } from "../components/ArcherMark";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { useI18n } from "../i18n/I18nProvider";

type Role = "CLIENT" | "FREELANCER";

export function RegistrationPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, register, isLoading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nextPath = params.get("next");
  const redirectAfterAuth = nextPath?.startsWith("/") ? nextPath : "/projects";

  // If already signed in, redirect
  if (user && !authLoading) {
    return <Navigate to={redirectAfterAuth} replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, role, displayName, username.trim().toLowerCase() || undefined);
      navigate(redirectAfterAuth);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }

  return <div className="registration-page auth-page"><div className="registration-panel auth-panel"><Link to="/" className="back-link"><ArrowLeft size={16} />{t("backToArcher")}</Link><div className="registration-content auth-content"><div className="auth-icon"><UserRound size={21} /></div><div className="eyebrow dark"><span className="eyebrow-dot" />{t("welcomeToArcher")}</div><h1>{t("createYourAccount")}</h1><p>{t("createAccountCopy")}</p><form onSubmit={submit} className="auth-form registration-form"><label>{t("fullName")}<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} autoComplete="name" /></label><label>{t("username")}<input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]{3,30}" autoComplete="username" autoCapitalize="none" spellCheck={false} /><small className="field-hint">{t("usernameHint")}</small></label><label>{t("emailAddress")}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>{t("password")}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></label><fieldset className="role-fieldset"><legend>{t("chooseRole")}</legend><div className="role-grid"><button type="button" className={role === "CLIENT" ? "role-card active" : "role-card"} onClick={() => setRole("CLIENT")} aria-pressed={role === "CLIENT"}><span className="role-card-icon"><BriefcaseBusiness size={18} /></span><strong>{t("clientRole")}</strong><small>{t("clientRoleCopy")}</small>{role === "CLIENT" && <Check className="role-card-check" size={16} />}</button><button type="button" className={role === "FREELANCER" ? "role-card active" : "role-card"} onClick={() => setRole("FREELANCER")} aria-pressed={role === "FREELANCER"}><span className="role-card-icon"><UserRound size={18} /></span><strong>{t("freelancerRole")}</strong><small>{t("freelancerRoleCopy")}</small>{role === "FREELANCER" && <Check className="role-card-check" size={16} />}</button></div></fieldset>{error && <div className="form-error">{error}</div>}<Button type="submit" className="full-button" disabled={loading}>{loading ? t("loading") : t("register")} <ArrowUpRight size={16} /></Button></form><p className="terms-copy">{t("termsCopy")}</p></div></div><aside className="registration-aside auth-aside"><ArcherMark size={46} /><div className="auth-quote">"{t("authQuote")}"</div><span>— {t("theArcherTeam")}</span></aside></div>;
}
