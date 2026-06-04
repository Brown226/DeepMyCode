import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// Suppress scrollTo errors in happy-dom
if (typeof window !== "undefined" && !window.HTMLElement.prototype.scrollTo) {
  window.HTMLElement.prototype.scrollTo = vi.fn();
}

// Mock Wails runtime for tests
if (typeof window !== "undefined" && !(window as any).runtime) {
  (window as any).runtime = {
    EventsOn: vi.fn(() => () => {}),
    EventsOff: vi.fn(),
    EventsEmit: vi.fn(),
    WindowSetTitle: vi.fn(),
  };
}
