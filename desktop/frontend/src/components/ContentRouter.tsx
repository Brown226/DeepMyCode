// ContentRouter renders content based on the active tab type.
// Phase 1: renders children directly (existing app content).
// Phase 2+: will switch between session/settings/terminal/browser views.

import { useTabState } from "../lib/tabStore";
import { useT } from "../lib/i18n";
import type { ReactNode } from "react";

interface ContentRouterProps {
  /** Fallback content when no tab is active (Phase 1: existing app) */
  children: ReactNode;
}

export function ContentRouter({ children }: ContentRouterProps) {
  const t = useT();
  const state = useTabState();
  const active = state.tabs.find((tab) => tab.id === state.activeTabId);

  if (!active) {
    return (
      <div className="content-router content-router-empty" role="region">
        <div className="content-empty">
          <h2>{t("router.noTabOpen")}</h2>
          <p>{t("router.noTabOpenDesc")}</p>
        </div>
      </div>
    );
  }

  // Phase 1: always render children (existing app content).
  // Phase 2+: switch based on active.type
  return (
    <div className="content-router" role="region" data-active-tab={active.id}>
      {children}
    </div>
  );
}
