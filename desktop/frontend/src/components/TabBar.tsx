import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Settings as SettingsIcon, Clock, Terminal as TerminalIcon, Globe } from "lucide-react";
import { tabStore, useTabState, type TabType } from "../lib/tabStore";
import { useT } from "../lib/i18n";

function TabIcon({ type }: { type: TabType }) {
  switch (type) {
    case "session":
      return <MessageSquare size={12} data-testid="tab-icon-session" />;
    case "settings":
      return <SettingsIcon size={12} data-testid="tab-icon-settings" />;
    case "scheduled":
      return <Clock size={12} data-testid="tab-icon-scheduled" />;
    case "terminal":
      return <TerminalIcon size={12} data-testid="tab-icon-terminal" />;
    case "browser":
      return <Globe size={12} data-testid="tab-icon-browser" />;
  }
}

interface ContextMenuState {
  tabId: string;
  x: number;
  y: number;
}

export function TabBar() {
  const t = useT();
  const state = useTabState();
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menu]);

  if (state.tabs.length === 0) {
    return (
      <div className="tabbar tabbar-empty" role="tablist">
        <span className="tabbar-empty-text">{t("tabBar.empty")}</span>
      </div>
    );
  }

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  const handleCloseOthers = (keepId: string) => {
    for (const tab of state.tabs) {
      if (tab.id !== keepId) tabStore.closeTab(tab.id);
    }
    setMenu(null);
  };

  const handleCloseAll = () => {
    tabStore.closeAll();
    setMenu(null);
  };

  return (
    <div className="tabbar" role="tablist">
      {state.tabs.map((tab) => (
        <div
          key={tab.id}
          data-testid={`tab-${tab.id}`}
          role="tab"
          aria-selected={tab.id === state.activeTabId}
          className={`tab ${tab.id === state.activeTabId ? "active" : ""}`}
          onClick={() => tabStore.setActive(tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
        >
          <span className="tab-icon">
            <TabIcon type={tab.type} />
          </span>
          <span className="tab-title">{tab.title}</span>
          <button
            data-testid={`tab-close-${tab.id}`}
            className="tab-close"
            aria-label={t("tabBar.closeTab")}
            onClick={(e) => {
              e.stopPropagation();
              tabStore.closeTab(tab.id);
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {menu && (
        <div
          ref={menuRef}
          className="tab-context-menu"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          <button
            className="tab-context-item"
            onClick={() => {
              tabStore.closeTab(menu.tabId);
              setMenu(null);
            }}
          >
            {t("tabBar.closeTab")}
          </button>
          <button
            className="tab-context-item"
            onClick={() => handleCloseOthers(menu.tabId)}
          >
            {t("tabBar.closeOthers")}
          </button>
          <button className="tab-context-item" onClick={handleCloseAll}>
            {t("tabBar.closeAll")}
          </button>
        </div>
      )}
    </div>
  );
}
