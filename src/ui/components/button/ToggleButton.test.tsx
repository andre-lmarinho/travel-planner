import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DollarSign, List, Map as MapIcon } from "@/ui/components/icon";
import { ToggleButton } from "./ToggleButton";

describe("ToggleButton", () => {
  it("renders with basic options", () => {
    render(<ToggleButton options={["option1", "option2", "option3"]} value="option1" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: /option1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /option2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /option3/i })).toBeInTheDocument();
  });

  it("calls onChange when option is clicked", () => {
    const handleChange = vi.fn();

    render(<ToggleButton options={["planner", "map", "budget"]} value="planner" onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: /map/i }));
    expect(handleChange).toHaveBeenCalledWith("map");
  });

  it("renders with icons and labels", () => {
    const mockConfig = {
      planner: { label: "Planner", icon: List },
      map: { label: "Map", icon: MapIcon },
      budget: { label: "Budget", icon: DollarSign },
    };

    render(
      <ToggleButton
        options={["planner", "map", "budget"]}
        value="planner"
        onChange={() => {}}
        renderOption={(option) => mockConfig[option as keyof typeof mockConfig]}
      />
    );

    expect(screen.getByRole("button", { name: /planner/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /map/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /budget/i })).toBeInTheDocument();

    // Check that icons are present
    expect(screen.getByRole("button", { name: /planner/i })).toContainHTML("svg");
  });

  it("applies aria-pressed for selected state", () => {
    render(<ToggleButton options={["planner", "map", "budget"]} value="map" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: /map/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /planner/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /budget/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("applies disabled state", () => {
    render(
      <ToggleButton options={["planner", "map", "budget"]} value="planner" onChange={() => {}} disabled />
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("renders with consistent styling", () => {
    const { rerender } = render(
      <ToggleButton options={["option1", "option2"]} value="option1" onChange={() => {}} />
    );

    expect(screen.getByRole("button", { name: /option1/i })).toBeInTheDocument();

    rerender(<ToggleButton options={["option1", "option2"]} value="option2" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: /option2/i })).toBeInTheDocument();
  });
});
