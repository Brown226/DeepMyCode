import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("test infrastructure smoke", () => {
  it("vitest runs", () => {
    expect(1 + 1).toBe(2);
  });

  it("@testing-library/react renders components", () => {
    render(<div data-testid="smoke">hello</div>);
    expect(screen.getByTestId("smoke")).toHaveTextContent("hello");
  });

  it("happy-dom provides DOM globals", () => {
    expect(typeof document).toBe("object");
    expect(typeof window).toBe("object");
  });
});
