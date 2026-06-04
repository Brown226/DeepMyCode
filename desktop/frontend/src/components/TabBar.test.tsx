import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabBar } from "./TabBar";
import { tabStore } from "../lib/tabStore";

vi.mock("../lib/i18n", () => ({
  useT: () => (key: string) => {
    const map: Record<string, string> = {
      "tabBar.empty": "No tabs open",
      "tabBar.closeTab": "Close tab",
      "tabBar.closeOthers": "Close others",
      "tabBar.closeAll": "Close all",
    };
    return map[key] || key;
  },
}));

describe("TabBar", () => {
  beforeEach(() => {
    localStorage.clear();
    tabStore.closeAll();
    (tabStore as any).hydrated = false;
  });

  it("renders empty state when no tabs", () => {
    render(<TabBar />);
    expect(screen.getByText(/no tabs open/i)).toBeInTheDocument();
  });

  it("renders a tab for each open tab", () => {
    tabStore.openTab("s1", "session", "Session 1");
    tabStore.openTab("s2", "session", "Session 2");
    render(<TabBar />);
    expect(screen.getByText("Session 1")).toBeInTheDocument();
    expect(screen.getByText("Session 2")).toBeInTheDocument();
  });

  it("highlights the active tab", () => {
    tabStore.openTab("s1", "session", "Session 1");
    tabStore.openTab("s2", "session", "Session 2");
    tabStore.setActive("s2");
    render(<TabBar />);
    const tab = screen.getByTestId("tab-s2");
    expect(tab).toHaveClass("active");
  });

  it("switches tab on click", async () => {
    tabStore.openTab("s1", "session", "Session 1");
    tabStore.openTab("s2", "session", "Session 2");
    render(<TabBar />);
    await userEvent.click(screen.getByTestId("tab-s1"));
    expect(tabStore.getState().activeTabId).toBe("s1");
  });

  it("closes tab on close button click", async () => {
    tabStore.openTab("s1", "session", "Session 1");
    tabStore.openTab("s2", "session", "Session 2");
    render(<TabBar />);
    await userEvent.click(screen.getByTestId("tab-close-s1"));
    expect(tabStore.getState().tabs.find((t) => t.id === "s1")).toBeUndefined();
  });

  it("shows context menu on right click", () => {
    tabStore.openTab("s1", "session", "Session 1");
    tabStore.openTab("s2", "session", "Session 2");
    render(<TabBar />);
    const tab = screen.getByTestId("tab-s1");
    fireEvent.contextMenu(tab);
    expect(screen.getByText(/close tab/i)).toBeInTheDocument();
    expect(screen.getByText(/close others/i)).toBeInTheDocument();
  });

  it("renders different icon per tab type", () => {
    tabStore.openTab("s1", "session", "Session");
    tabStore.openTab("settings", "settings", "Settings");
    render(<TabBar />);
    expect(screen.getByTestId("tab-icon-session")).toBeInTheDocument();
    expect(screen.getByTestId("tab-icon-settings")).toBeInTheDocument();
  });
});
