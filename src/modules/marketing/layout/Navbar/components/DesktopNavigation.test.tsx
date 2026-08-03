import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesktopActions } from "./DesktopActions";
import { DesktopNavigation } from "./DesktopNavigation";

describe("DesktopNavigation", () => {
  it("links to the sections on the marketing home", () => {
    render(<DesktopNavigation />);

    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "/#features");
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/#how-it-works");
    expect(screen.getByRole("link", { name: "Plan together" })).toHaveAttribute("href", "/#collaboration");
  });
});

describe("DesktopActions", () => {
  it("offers login and signup to visitors", () => {
    render(<DesktopActions plannerHref={null} />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/signup");
  });

  it("sends a signed-in user to their planner", () => {
    render(<DesktopActions plannerHref="/u/andre" />);

    expect(screen.getByRole("link", { name: "Go to planner" })).toHaveAttribute("href", "/u/andre");
  });
});
