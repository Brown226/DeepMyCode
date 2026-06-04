import { useSyncExternalStore } from "react";
import type { SessionMeta } from "./types";

export type OrganizeBy = "recent" | "project" | "time";

export interface ProjectInfo {
  path: string;
  name: string;
  sessionCount: number;
  lastActivityAt: number;
  totalTurns: number;
}

export interface SidebarGroup {
  project: ProjectInfo;
  sessions: SessionMeta[];
}

export interface SidebarState {
  groups: SidebarGroup[];
  selectedIds: Set<string>;
  searchQuery: string;
  organizeBy: OrganizeBy;
}

class SidebarStoreImpl {
  private state: SidebarState = {
    groups: [],
    selectedIds: new Set(),
    searchQuery: "",
    organizeBy: "recent",
  };
  private listeners = new Set<() => void>();

  getState = (): SidebarState => this.state;

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  setGroups = (groups: SidebarGroup[]): void => {
    this.state = { ...this.state, groups };
    this.emit();
  };

  toggleSelected = (sessionId: string): void => {
    const next = new Set(this.state.selectedIds);
    if (next.has(sessionId)) {
      next.delete(sessionId);
    } else {
      next.add(sessionId);
    }
    this.state = { ...this.state, selectedIds: next };
    this.emit();
  };

  clearSelection = (): void => {
    if (this.state.selectedIds.size === 0) return;
    this.state = { ...this.state, selectedIds: new Set() };
    this.emit();
  };

  setSearch = (q: string): void => {
    if (this.state.searchQuery === q) return;
    this.state = { ...this.state, searchQuery: q };
    this.emit();
  };

  setOrganizeBy = (mode: OrganizeBy): void => {
    if (this.state.organizeBy === mode) return;
    this.state = { ...this.state, organizeBy: mode };
    this.emit();
  };

  deriveVisibleGroups = (): SidebarGroup[] => {
    const q = this.state.searchQuery.trim().toLowerCase();
    const matches = (s: SessionMeta) => {
      if (!q) return true;
      return (
        s.title?.toLowerCase().includes(q) ||
        s.preview?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q)
      );
    };
    const filtered = this.state.groups
      .map((g) => ({ ...g, sessions: g.sessions.filter(matches) }))
      .filter((g) => g.sessions.length > 0);

    switch (this.state.organizeBy) {
      case "project":
        return filtered;
      case "time": {
        const flat = filtered.flatMap((g) => g.sessions.map((s) => ({ g, s })));
        flat.sort((a, b) => b.s.updatedAt - a.s.updatedAt);
        const byProject = new Map<string, SidebarGroup>();
        for (const { g, s } of flat) {
          if (!byProject.has(g.project.path)) {
            byProject.set(g.project.path, { ...g, sessions: [] });
          }
          byProject.get(g.project.path)!.sessions.push(s);
        }
        return Array.from(byProject.values());
      }
      case "recent":
      default: {
        return filtered
          .map((g) => ({
            ...g,
            sessions: [...g.sessions].sort((a, b) => b.updatedAt - a.updatedAt),
          }))
          .sort((a, b) => b.project.lastActivityAt - a.project.lastActivityAt);
      }
    }
  };

  reset = (): void => {
    this.state = {
      groups: [],
      selectedIds: new Set(),
      searchQuery: "",
      organizeBy: "recent",
    };
    this.emit();
  };

  private emit(): void {
    for (const l of this.listeners) l();
  }
}

export const sidebarStore = new SidebarStoreImpl();

export function useSidebarState(): SidebarState {
  return useSyncExternalStore(sidebarStore.subscribe, sidebarStore.getState);
}
