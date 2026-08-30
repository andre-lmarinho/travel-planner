import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DesktopNavigation } from "./DesktopNavigation";

describe("DesktopNavigation", () => {
  it("renders direct links to the marketing sections", () => {
    render(<DesktopNavigation />);

    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "/#features");
    expect(screen.getByRole("link", { name: "Inspiration" })).toHaveAttribute("href", "/#inspiration");
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/#faq");
    expect(screen.queryByRole("button", { name: "Explore" })).toBeNull();
  });
});
