import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { tabStore, useTabState } from "./tabStore";

describe("tabStore", () => {
  beforeEach(() => {
    localStorage.clear();
    tabStore.closeAll();
    // Reset hydrated flag by calling restore after closeAll
    (tabStore as any).hydrated = false;
  });

  describe("initial state", () => {
    it("starts with no tabs", () => {
      const { result } = renderHook(() => useTabState());
      expect(result.current.tabs).toEqual([]);
      expect(result.current.activeTabId).toBeNull();
    });
  });

  describe("openTab", () => {
    it("opens a new tab", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("session-1", "session", "Session 1");
      });
      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0]).toMatchObject({
        id: "session-1",
        type: "session",
        title: "Session 1",
      });
      expect(result.current.activeTabId).toBe("session-1");
    });

    it("focuses existing tab instead of duplicating", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("session-1", "session", "First");
        tabStore.openTab("session-2", "session", "Second");
        tabStore.openTab("session-1", "session", "First Renamed");
      });
      expect(result.current.tabs).toHaveLength(2);
      expect(result.current.activeTabId).toBe("session-1");
      expect(result.current.tabs[0].title).toBe("First");
    });
  });

  describe("closeTab", () => {
    it("removes the tab", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
        tabStore.openTab("b", "session", "B");
        tabStore.closeTab("a");
      });
      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].id).toBe("b");
    });

    it("moves active to next tab when closing active", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
        tabStore.openTab("b", "session", "B");
        tabStore.openTab("c", "session", "C");
        tabStore.setActive("b");
        tabStore.closeTab("b");
      });
      expect(result.current.activeTabId).toBe("c");
    });

    it("sets activeTabId to null when closing the last tab", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
        tabStore.closeTab("a");
      });
      expect(result.current.activeTabId).toBeNull();
    });
  });

  describe("setActive", () => {
    it("switches the active tab", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
        tabStore.openTab("b", "session", "B");
        tabStore.setActive("a");
      });
      expect(result.current.activeTabId).toBe("a");
    });
  });

  describe("renameTab", () => {
    it("updates the tab title", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "Old");
        tabStore.renameTab("a", "New");
      });
      expect(result.current.tabs[0].title).toBe("New");
    });
  });

  describe("reorderTab", () => {
    it("moves a tab from one position to another", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
        tabStore.openTab("b", "session", "B");
        tabStore.openTab("c", "session", "C");
        tabStore.reorderTab(0, 2);
      });
      expect(result.current.tabs.map((t) => t.id)).toEqual(["b", "c", "a"]);
    });
  });

  describe("closeAll", () => {
    it("removes all tabs and resets active", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
        tabStore.openTab("b", "session", "B");
        tabStore.closeAll();
      });
      expect(result.current.tabs).toEqual([]);
      expect(result.current.activeTabId).toBeNull();
    });
  });

  describe("persistence", () => {
    it("persists state to localStorage", () => {
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
        tabStore.openTab("b", "session", "B");
        tabStore.setActive("b");
      });
      const stored = JSON.parse(localStorage.getItem("deepmycode.tab.state") || "{}");
      expect(stored.tabs).toHaveLength(2);
      expect(stored.activeTabId).toBe("b");
    });

    it("restores state from localStorage on restore()", () => {
      localStorage.setItem("deepmycode.tab.state", JSON.stringify({
        tabs: [{ id: "x", type: "session", title: "Restored" }],
        activeTabId: "x",
      }));
      (tabStore as any).hydrated = false;
      tabStore.restore();
      const { result } = renderHook(() => useTabState());
      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].title).toBe("Restored");
    });

    it("handles localStorage being unavailable", () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      const { result } = renderHook(() => useTabState());
      act(() => {
        tabStore.openTab("a", "session", "A");
      });
      expect(result.current.tabs).toHaveLength(1);
      setItemSpy.mockRestore();
    });
  });

  describe("subscribe semantics", () => {
    it("notifies subscribers on state change", () => {
      const cb = vi.fn();
      tabStore.subscribe(cb);
      tabStore.openTab("a", "session", "A");
      expect(cb).toHaveBeenCalled();
    });

    it("unsubscribe stops notifications", () => {
      const cb = vi.fn();
      const unsub = tabStore.subscribe(cb);
      unsub();
      tabStore.openTab("a", "session", "A");
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
