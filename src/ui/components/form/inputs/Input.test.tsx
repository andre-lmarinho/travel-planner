import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmailField, PasswordField } from "@/ui/components/form";

describe("PasswordField", () => {
  it("toggles password visibility", () => {
    render(<PasswordField name="password" label="Password" />);

    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    expect(input).toHaveAttribute("type", "password");
    expect(toggleButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute("type", "text");
    expect(toggleButton).toHaveAttribute("aria-label", "Hide password");
    expect(toggleButton).toHaveAttribute("aria-pressed", "true");
  });
});

describe("EmailField", () => {
  it("renders label and placeholder", () => {
    render(<EmailField name="email" label="Email address" placeholder="you@example.com" />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("applies email-related attributes", () => {
    render(<EmailField name="email" label="Email" />);

    const input = screen.getByLabelText("Email");

    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocapitalize", "none");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAttribute("autocorrect", "off");
    expect(input).toHaveAttribute("inputmode", "email");
  });
});
