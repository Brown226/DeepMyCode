// AppShell is the top-level layout shell: TabBar + children (existing app content).
// Phase 1: wraps existing App.tsx content without modifying it.
// Phase 2+: will add Sidebar and ContentRouter.

import { useEffect, type ReactNode } from "react";
import { TabBar } from "./TabBar";
import { Welcome } from "./WelcomePage";
import { tabStore, useTabState } from "../lib/tabStore";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { tabs } = useTabState();

  useEffect(() => {
    tabStore.restore();
  }, []);

  return (
    <div className="appshell" role="application" aria-label="DeepMyCode">
      <main className="appshell-main">
        <TabBar />
        <div className="appshell-content">
          {tabs.length === 0 ? <Welcome /> : children}
        </div>
      </main>
    </div>
  );
}
