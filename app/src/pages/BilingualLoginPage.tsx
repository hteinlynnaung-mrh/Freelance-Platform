import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, LockKeyhole } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { useI18n } from "../i18n/I18nProvider";

export function BilingualLoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, login, isLoading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nextPath = params.get("next");
  const redirectAfterAuth = nextPath?.startsWith("/") ? nextPath : "/";

  // If already signed in, redirect immediately
  if (user && !authLoading) {
    return <Navigate to={redirectAfterAuth} replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(emailOrUsername, password);
      navigate(redirectAfterAuth);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Link to="/" className="back-link"><ArrowLeft size={16} />{t("backToArcher")}</Link>
        <div className="auth-content">
          <div className="auth-icon"><LockKeyhole size={21} /></div>
          <div className="eyebrow dark"><span className="eyebrow-dot" />{t("welcomeToArcher")}</div>
          <h1>{t("welcomeBack")}</h1>
          <p>{t("signInCopy")}</p>
          <form onSubmit={submit} className="auth-form">
            <label>
              {t("emailAddress")} / {t("username")}
              <input
                type="text"
                value={emailOrUsername}
                onChange={(event) => setEmailOrUsername(event.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label>
              {t("password")}
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="current-password" />
            </label>
            {error && <div className="form-error">{error}</div>}
            <Button type="submit" className="full-button" disabled={loading}>
              {loading ? t("loading") : t("signIn")} <ArrowUpRight size={16} />
            </Button>
          </form>
          <p className="auth-switch-copy">
            {t("noAccountYet")}{" "}
            <Link to="/register" className="auth-switch-link">{t("createAccount")}</Link>
          </p>
        </div>
      </div>
      <div className="auth-aside">
        <div className="auth-quote">"{t("authQuote")}"</div>
        <span>— {t("theArcherTeam")}</span>
      </div>
    </div>
  );
}
