import { useState } from "react";
import { AlertTriangle, ArrowLeft, Lock, ShieldAlert, Trash2, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useI18n } from "../i18n/I18nProvider";

export function AccountSettingsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (confirmText.trim().toUpperCase() !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAccount(password.trim() || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("somethingWentWrong"));
      setIsDeleting(false);
    }
  }

  return (
    <div className="account-page">
      <div className="account-inner">
        <Button asChild variant="outline" size="sm" className="detail-back-button">
          <Link to="/projects#projects">
            <ArrowLeft size={16} />
            {t("backToProjects")}
          </Link>
        </Button>

        <div className="account-header">
          <div className="eyebrow dark">
            <span className="eyebrow-dot" />
            {t("accountEyebrow")}
          </div>
          <h1>{t("accountSettings")}</h1>
          <p>{t("accountSettingsCopy")}</p>
        </div>

        <div className="account-sections">
          {/* Account Profile Card */}
          <Card className="account-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="account-avatar-placeholder">
                  <User size={22} />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {user.username ? `@${user.username}` : user.email}
                  </CardTitle>
                  <CardDescription className="text-xs">{user.email}</CardDescription>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary" className="font-mono text-xs uppercase">
                    {user.role === "CLIENT" ? t("clientBadge") : t("freelancerBadge")}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <dl className="account-details-list">
                <div className="account-detail-item">
                  <dt>{t("accountEmail")}</dt>
                  <dd>{user.email}</dd>
                </div>
                {user.username && (
                  <div className="account-detail-item">
                    <dt>{t("accountUsername")}</dt>
                    <dd>@{user.username}</dd>
                  </div>
                )}
                <div className="account-detail-item">
                  <dt>{t("accountRole")}</dt>
                  <dd>{user.role === "CLIENT" ? t("clientRole") : t("freelancerRole")}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Danger Zone: Delete User Account */}
          <Card className="danger-zone-card">
            <CardHeader>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert size={20} />
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  {t("dangerZone")}
                </span>
              </div>
              <CardTitle className="text-lg mt-2 text-rose-700 dark:text-rose-300">
                {t("deleteAccount")}
              </CardTitle>
              <CardDescription className="text-xs text-rose-600/80 dark:text-rose-300/80 leading-relaxed">
                {t("deleteAccountWarning")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!confirmOpen ? (
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {t("deleteAccountActionWarning")}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    className="flex-none bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Trash2 size={15} />
                    {t("deleteAccount")}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleDelete} className="danger-confirm-form">
                  <div className="danger-confirm-banner">
                    <AlertTriangle size={18} className="text-rose-600 flex-none" />
                    <div>
                      <strong>{t("confirmDeleteAccountModalTitle")}</strong>
                      <p>{t("deleteAccountWarning")}</p>
                    </div>
                  </div>

                  <div className="danger-inputs">
                    <label>
                      <span>{t("deleteAccountConfirmPrompt")}</span>
                      <div className="input-with-icon">
                        <Lock size={15} />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Your current password"
                          autoComplete="current-password"
                          required
                        />
                      </div>
                    </label>

                    <label>
                      <span>Type <strong>DELETE</strong> to confirm permanent deletion:</span>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        required
                      />
                    </label>
                  </div>

                  {error && <div className="form-error">{error}</div>}

                  <div className="danger-actions">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfirmOpen(false);
                        setPassword("");
                        setConfirmText("");
                        setError(null);
                      }}
                      disabled={isDeleting}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting || confirmText.trim().toUpperCase() !== "DELETE"}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      <Trash2 size={15} />
                      {isDeleting ? t("deletingAccount") : t("deleteAccountButton")}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
