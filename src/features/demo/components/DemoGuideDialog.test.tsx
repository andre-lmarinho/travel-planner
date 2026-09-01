import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemoGuideDialog } from "./DemoGuideDialog";

describe("DemoGuideDialog", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when not in demo mode", () => {
    const { container } = render(<DemoGuideDialog isDemo={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the demo explanation and reset countdown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:30:00"));
    render(<DemoGuideDialog isDemo />);

    expect(screen.getAllByText(/You can view, edit and create trips/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/What is Turistar\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Resets in about 30 min/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument();
  });

  it("dismisses when the user clicks Got it", () => {
    render(<DemoGuideDialog isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(screen.queryByRole("button", { name: "Got it" })).toBeNull();
  });
});
