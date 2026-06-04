import { SquarePen } from "lucide-react";
import { useT } from "../lib/i18n";

export function Welcome() {
  const t = useT();
  return (
    <div className="welcome-placeholder">
      <div className="welcome-placeholder__icon">
        <SquarePen size={40} strokeWidth={1.2} />
      </div>
      <h2 className="welcome-placeholder__title">{t("shell.welcomeTitle")}</h2>
      <p className="welcome-placeholder__desc">{t("shell.welcomeDesc")}</p>
      <div className="welcome-placeholder__tips">
        <div className="welcome-placeholder__tip">
          <kbd>/</kbd> <span>{t("shell.tipSlash")}</span>
        </div>
        <div className="welcome-placeholder__tip">
          <kbd>⌘N</kbd> <span>{t("shell.tipNewSession")}</span>
        </div>
      </div>
    </div>
  );
}
