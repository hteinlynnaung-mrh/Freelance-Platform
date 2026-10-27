import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, LockKeyhole } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, storeAuthSession, type AuthSession } from "../api/client";
import { Button } from "../components/ui/Button";
import { useI18n } from "../i18n/I18nProvider";

type LoginResponse = { data: AuthSession };

export function BilingualLoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate(); const [params] = useSearchParams(); const [email, setEmail] = useState("client1@archer.local"); const [password, setPassword] = useState("ArcherDemo123!"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const isRegister = params.get("mode") === "register";
  const nextPath = params.get("next");
  const redirectAfterAuth = nextPath?.startsWith("/") ? nextPath : "/";
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); setLoading(true); try { const result = await api<LoginResponse>(`/api/v1/auth/${isRegister ? "register" : "login"}`, { method: "POST", body: JSON.stringify(isRegister ? { email, password, role: "CLIENT", displayName: email.split("@")[0] } : { email, password }) }); storeAuthSession(result.data); navigate(redirectAfterAuth); } catch (reason) { setError(reason instanceof Error ? reason.message : t("somethingWentWrong")); } finally { setLoading(false); } }
  return <div className="auth-page"><div className="auth-panel"><Link to="/" className="back-link"><ArrowLeft size={16} />{t("backToProjects")}</Link><div className="auth-content"><div className="auth-icon"><LockKeyhole size={21} /></div><div className="eyebrow dark"><span className="eyebrow-dot" />{t("welcomeToArcher")}</div><h1>{isRegister ? t("startNextChapter") : t("welcomeBack")}</h1><p>{isRegister ? t("createAccountCopy") : t("signInCopy")}</p><form onSubmit={submit} className="auth-form"><label>{t("emailAddress")}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>{t("password")}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label>{error && <div className="form-error">{error}</div>}<Button type="submit" className="full-button" disabled={loading}>{loading ? t("loading") : isRegister ? t("createAccount") : t("signIn")} <ArrowUpRight size={16} /></Button></form><div className="demo-hint">{t("demoAccount")}<br /><strong>client1@archer.local</strong> · <strong>ArcherDemo123!</strong></div></div></div><div className="auth-aside"><div className="auth-quote">“{t("authQuote")}”</div><span>— {t("theArcherTeam")}</span></div></div>;
}
