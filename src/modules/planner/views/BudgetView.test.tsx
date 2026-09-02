import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/features/activity/types";
import type { Entry } from "@/features/budget/types";
import { BudgetView } from "./BudgetView";

const shared = vi.hoisted(() => ({ createEntry: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/trpc/react", () => ({
  trpc: {
    useUtils: () => ({ viewer: { budget: { get: { invalidate: shared.invalidate } } } }),
    viewer: {
      budget: {
        get: { useQuery: () => ({ data: undefined }) },
        createEntry: { useMutation: () => ({ mutateAsync: shared.createEntry }) },
        updateEntry: { useMutation: () => ({ mutateAsync: vi.fn() }) },
        deleteEntry: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      },
    },
  },
}));
const days = [
  {
    id: "day-1",
    label: "Mon, 05 Jul",
    activities: [
      { id: "activity-1", title: "Museum", color: "bg-[var(--color-1)]", budget: 40 } satisfies Activity,
    ],
  },
];
const entry: Entry = { id: "entry-1", description: "Airport transfer", category: "transport", amount: 85 };
beforeEach(() => {
  shared.createEntry.mockReset();
  shared.createEntry.mockResolvedValue("entry-2");
  shared.invalidate.mockReset();
});
describe("BudgetView", () => {
  it("shows total, categories, and entries", () => {
    render(<BudgetView planId="plan-1" days={days} initialEntries={[entry]} />);
    expect(screen.getByLabelText("Total spent: $125.00")).toBeInTheDocument();
    expect(screen.getAllByText("Transportation")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Tours & Activities")[0]).toBeInTheDocument();
    expect(screen.getByText("Airport transfer")).toBeInTheDocument();
  });
  it("creates an expense from the table", async () => {
    render(<BudgetView planId="plan-1" days={days} initialEntries={[]} />);
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Dinner" } });
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    await waitFor(() =>
      expect(shared.createEntry).toHaveBeenCalledWith({
        planId: "plan-1",
        payload: { description: "Dinner", category: "transport", amount: 45 },
      })
    );
    expect(await screen.findByText("Dinner")).toBeInTheDocument();
  });
});
