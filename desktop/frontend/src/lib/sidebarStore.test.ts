import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { sidebarStore, useSidebarState, type SidebarGroup } from "./sidebarStore";
import type { SessionMeta } from "./types";

const mockSessions: SessionMeta[] = [
  { name: "s1", title: "Build auth", preview: "JWT setup", updatedAt: 200, turns: 5, model: "m" } as SessionMeta,
  { name: "s2", title: "Fix login", preview: "Login bug", updatedAt: 100, turns: 3, model: "m" } as SessionMeta,
];

const mockGroups: SidebarGroup[] = [
  {
    project: { path: "/p1", name: "alpha", sessionCount: 2, lastActivityAt: 200, totalTurns: 8 },
    sessions: mockSessions,
  },
];

describe("sidebarStore", () => {
  beforeEach(() => {
    sidebarStore.reset();
  });

  describe("initial state", () => {
    it("starts with defaults", () => {
      const { result } = renderHook(() => useSidebarState());
      expect(result.current.groups).toEqual([]);
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.searchQuery).toBe("");
      expect(result.current.organizeBy).toBe("recent");
    });
  });

  describe("setGroups", () => {
    it("updates the session list", () => {
      const { result } = renderHook(() => useSidebarState());
      act(() => {
        sidebarStore.setGroups(mockGroups);
      });
      expect(result.current.groups).toEqual(mockGroups);
    });
  });

  describe("selection", () => {
    it("toggles selection", () => {
      const { result } = renderHook(() => useSidebarState());
      act(() => {
        sidebarStore.toggleSelected("s1");
        sidebarStore.toggleSelected("s2");
      });
      expect(result.current.selectedIds.has("s1")).toBe(true);
      expect(result.current.selectedIds.has("s2")).toBe(true);

      act(() => {
        sidebarStore.toggleSelected("s1");
      });
      expect(result.current.selectedIds.has("s1")).toBe(false);
      expect(result.current.selectedIds.has("s2")).toBe(true);
    });

    it("clears all selections", () => {
      const { result } = renderHook(() => useSidebarState());
      act(() => {
        sidebarStore.toggleSelected("s1");
        sidebarStore.toggleSelected("s2");
        sidebarStore.clearSelection();
      });
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe("search", () => {
    it("updates the search query", () => {
      const { result } = renderHook(() => useSidebarState());
      act(() => {
        sidebarStore.setSearch("hello");
      });
      expect(result.current.searchQuery).toBe("hello");
    });
  });

  describe("organize", () => {
    it("changes the organize mode", () => {
      const { result } = renderHook(() => useSidebarState());
      act(() => {
        sidebarStore.setOrganizeBy("project");
      });
      expect(result.current.organizeBy).toBe("project");
    });
  });

  describe("deriveVisibleGroups", () => {
    it("filters by search query", () => {
      sidebarStore.setGroups(mockGroups);
      sidebarStore.setSearch("auth");
      const visible = sidebarStore.deriveVisibleGroups();
      expect(visible).toHaveLength(1);
      expect(visible[0].sessions).toHaveLength(1);
      expect(visible[0].sessions[0].name).toBe("s1");
    });

    it("sorts by recent (default)", () => {
      sidebarStore.setGroups(mockGroups);
      const visible = sidebarStore.deriveVisibleGroups();
      expect(visible[0].sessions[0].name).toBe("s1"); // s1 has higher updatedAt
    });
  });
});
