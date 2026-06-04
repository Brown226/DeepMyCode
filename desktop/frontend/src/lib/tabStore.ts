import { useSyncExternalStore } from "react";

export type TabType = "session" | "settings" | "scheduled" | "terminal" | "browser";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  meta?: Record<string, unknown>;
}

export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

const STORAGE_KEY = "deepmycode.tab.state";
const EMPTY: TabState = { tabs: [], activeTabId: null };

class TabStoreImpl {
  private state: TabState = EMPTY;
  private listeners = new Set<() => void>();
  private hydrated = false;

  getState = (): TabState => this.state;

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  restore = (): void => {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<TabState>;
      if (Array.isArray(parsed.tabs)) {
        this.state = {
          tabs: parsed.tabs.filter((t): t is Tab =>
            !!t && typeof t.id === "string" && typeof t.type === "string" && typeof t.title === "string"
          ),
          activeTabId: typeof parsed.activeTabId === "string" ? parsed.activeTabId : null,
        };
        this.emit();
      }
    } catch {
      // Malformed JSON or storage blocked — start empty.
    }
  };

  openTab = (id: string, type: TabType, title: string, meta?: Record<string, unknown>): void => {
    const existing = this.state.tabs.find((t) => t.id === id);
    if (existing) {
      if (this.state.activeTabId !== id) {
        this.state = { ...this.state, activeTabId: id };
        this.persist();
        this.emit();
      }
      return;
    }
    this.state = {
      tabs: [...this.state.tabs, { id, type, title, meta }],
      activeTabId: id,
    };
    this.persist();
    this.emit();
  };

  closeTab = (id: string): void => {
    const idx = this.state.tabs.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const tabs = this.state.tabs.filter((t) => t.id !== id);
    let activeTabId = this.state.activeTabId;
    if (activeTabId === id) {
      if (tabs.length === 0) {
        activeTabId = null;
      } else if (idx >= tabs.length) {
        activeTabId = tabs[tabs.length - 1].id;
      } else {
        activeTabId = tabs[idx].id;
      }
    }
    this.state = { tabs, activeTabId };
    this.persist();
    this.emit();
  };

  setActive = (id: string): void => {
    if (this.state.activeTabId === id) return;
    if (!this.state.tabs.some((t) => t.id === id)) return;
    this.state = { ...this.state, activeTabId: id };
    this.persist();
    this.emit();
  };

  renameTab = (id: string, title: string): void => {
    this.state = {
      ...this.state,
      tabs: this.state.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    };
    this.persist();
    this.emit();
  };

  reorderTab = (fromIdx: number, toIdx: number): void => {
    if (fromIdx === toIdx) return;
    if (fromIdx < 0 || fromIdx >= this.state.tabs.length) return;
    if (toIdx < 0 || toIdx >= this.state.tabs.length) return;
    const tabs = [...this.state.tabs];
    const [moved] = tabs.splice(fromIdx, 1);
    tabs.splice(toIdx, 0, moved);
    this.state = { ...this.state, tabs };
    this.persist();
    this.emit();
  };

  closeAll = (): void => {
    if (this.state.tabs.length === 0) return;
    this.state = EMPTY;
    this.persist();
    this.emit();
  };

  private emit(): void {
    for (const l of this.listeners) l();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tabs: this.state.tabs,
        activeTabId: this.state.activeTabId,
      }));
    } catch {
      // localStorage may be unavailable.
    }
  }
}

export const tabStore = new TabStoreImpl();

export function useTabState(): TabState {
  return useSyncExternalStore(tabStore.subscribe, tabStore.getState);
}
