import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VisibilitySection } from "./VisibilitySection";

const { mockUsePlannerContext, mockSetPlanVisibility } = vi.hoisted(() => ({
  mockUsePlannerContext: vi.fn(),
  mockSetPlanVisibility: vi.fn(),
}));

vi.mock("@/trpc/react", () => ({
  trpc: {
    viewer: {
      plan: {
        setVisibility: {
          useMutation: () => ({
            mutateAsync: mockSetPlanVisibility,
            isPending: false,
          }),
        },
      },
    },
  },
}));

vi.mock("@/features/plan/hooks/PlannerContext", () => ({
  usePlannerContext: () => mockUsePlannerContext(),
}));

// Exercise the section's own logic (optimistic update + rollback) without the dropdown's DOM:
// the stub button just flips the value through onChange like a real selection would.
vi.mock("@/ui/components/select/SelectMenu", () => ({
  SelectMenu: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (next: string) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(value === "public" ? "private" : "public")}>
      visibility: {value}
    </button>
  ),
}));

describe("VisibilitySection", () => {
  beforeEach(() => {
    mockUsePlannerContext.mockReset();
    mockSetPlanVisibility.mockReset();
    mockUsePlannerContext.mockReturnValue({
      planId: "plan-1",
      isPublic: false,
      canManageMembers: true,
    });
  });

  it("publishes the plan when switched to public", async () => {
    mockSetPlanVisibility.mockResolvedValue(undefined);
    render(<VisibilitySection />);

    fireEvent.click(screen.getByRole("button", { name: /visibility: private/i }));

    await waitFor(() =>
      expect(mockSetPlanVisibility).toHaveBeenCalledWith({ planId: "plan-1", isPublic: true })
    );
    expect(screen.getByRole("button", { name: /visibility: public/i })).toBeInTheDocument();
  });

  it("reverts and surfaces an error when the update fails", async () => {
    mockSetPlanVisibility.mockRejectedValue(new Error("rls denied"));
    render(<VisibilitySection />);

    fireEvent.click(screen.getByRole("button", { name: /visibility: private/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update visibility");
    expect(screen.getByRole("button", { name: /visibility: private/i })).toBeInTheDocument();
  });

  it("disables the control and explains when the viewer cannot manage members", () => {
    mockUsePlannerContext.mockReturnValue({
      planId: "plan-1",
      isPublic: true,
      canManageMembers: false,
    });
    render(<VisibilitySection />);

    expect(screen.getByRole("button", { name: /visibility: public/i })).toBeDisabled();
    expect(screen.getByText("Only admins can change visibility.")).toBeInTheDocument();
    expect(mockSetPlanVisibility).not.toHaveBeenCalled();
  });
});
