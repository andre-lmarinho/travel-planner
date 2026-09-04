import type { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/features/activity/types";
import type { BudgetQueryResult, Entry } from "@/features/budget/types";
import { BudgetView } from "./BudgetView";

const shared = vi.hoisted(() => ({
  createEntry: vi.fn<(input: { planId: string; payload: Omit<Entry, "id"> }) => Promise<string>>(),
  updateEntry: vi.fn<(input: { entry: Entry }) => Promise<void>>(),
  deleteEntry: vi.fn<(input: { entryId: string }) => Promise<void>>(),
  invalidate: vi.fn(),
  client: null as QueryClient | null,
}));
vi.mock("@/trpc/react", async () => {
  const { useQuery, useMutation, useQueryClient } = await import("@tanstack/react-query");
  const key = ["budget"];
  return {
    trpc: {
      useUtils: () => {
        const client = useQueryClient();
        shared.client = client;
        return {
          viewer: {
            budget: {
              get: {
                cancel: () => client.cancelQueries({ queryKey: key }),
                getData: () => client.getQueryData<BudgetQueryResult>(key),
                setData: (
                  _input: unknown,
                  data:
                    | BudgetQueryResult
                    | undefined
                    | ((current: BudgetQueryResult | undefined) => BudgetQueryResult | undefined)
                ) => client.setQueryData<BudgetQueryResult>(key, data),
                invalidate: shared.invalidate,
              },
            },
          },
        };
      },
      viewer: {
        budget: {
          get: {
            useQuery: (_input: unknown, options: { initialData: BudgetQueryResult }) =>
              useQuery({
                queryKey: key,
                queryFn: async () => options.initialData,
                initialData: options.initialData,
                enabled: false,
              }),
          },
          createEntry: {
            useMutation: () =>
              useMutation({
                mutationFn: (input: Parameters<typeof shared.createEntry>[0]) => shared.createEntry(input),
                retry: false,
              }),
          },
          updateEntry: {
            useMutation: () =>
              useMutation({
                mutationFn: (input: Parameters<typeof shared.updateEntry>[0]) => shared.updateEntry(input),
                retry: false,
              }),
          },
          deleteEntry: {
            useMutation: () =>
              useMutation({
                mutationFn: (input: Parameters<typeof shared.deleteEntry>[0]) => shared.deleteEntry(input),
                retry: false,
              }),
          },
        },
      },
    },
  };
});
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
  shared.updateEntry.mockReset().mockResolvedValue(undefined);
  shared.deleteEntry.mockReset().mockResolvedValue(undefined);
});
describe("BudgetView", () => {
  it("renders without initial budget entries", () => {
    render(<BudgetView planId="plan-1" days={[]} />);

    expect(screen.getByLabelText("Total spent: $0.00")).toBeInTheDocument();
  });

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
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Amount")).toHaveValue("");
  });

  it("uses refreshed cache entries directly", async () => {
    render(<BudgetView planId="plan-1" days={[]} initialEntries={[entry]} />);
    act(() => {
      shared.client?.setQueryData(["budget"], {
        budget: 0,
        entries: [{ ...entry, description: "Refreshed" }],
      });
    });
    expect(await screen.findByText("Refreshed")).toBeInTheDocument();
    expect(screen.queryByText("Airport transfer")).not.toBeInTheDocument();
  });

  it("saves fractions from the row draft without relying on blur", async () => {
    render(<BudgetView planId="plan-1" days={days} initialEntries={[entry]} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    const row = screen.getByRole("button", { name: "Save entry" }).closest("tr");
    if (!row) throw new Error("Missing expense editor row");
    const amount = within(row).getByLabelText("Amount");
    fireEvent.change(amount, { target: { value: "0" } });
    expect(amount).toHaveValue("0");
    fireEvent.change(amount, { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    await waitFor(() =>
      expect(shared.updateEntry).toHaveBeenCalledWith({ entry: { ...entry, amount: 0.5 } })
    );
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save entry" })).not.toBeInTheDocument());
    expect(screen.getByLabelText("Total spent: $40.50")).toBeInTheDocument();
  });

  it("rolls back failed optimistic updates and keeps the draft for retry", async () => {
    let fail!: (reason: Error) => void;
    shared.updateEntry.mockImplementationOnce(
      () =>
        new Promise<void>((_, reject) => {
          fail = reject;
        })
    );
    render(<BudgetView planId="plan-1" days={days} initialEntries={[entry]} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    fireEvent.change(screen.getAllByLabelText("Amount")[0], { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    await waitFor(() => expect(screen.getByLabelText("Total spent: $50.00")).toBeInTheDocument());
    await act(async () => fail(new Error("offline")));
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to save budget entry");
    expect(shared.client?.getQueryData<BudgetQueryResult>(["budget"])?.entries).toEqual([entry]);
    expect(screen.getAllByLabelText("Amount")[0]).toHaveValue("10");
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    await waitFor(() => expect(shared.updateEntry).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save entry" })).not.toBeInTheDocument());
  });

  it("restores a deleted entry when persistence fails", async () => {
    let fail!: (reason: Error) => void;
    shared.deleteEntry.mockImplementationOnce(
      () =>
        new Promise<void>((_, reject) => {
          fail = reject;
        })
    );
    render(<BudgetView planId="plan-1" days={[]} initialEntries={[entry]} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    await waitFor(() => expect(screen.queryByText("Airport transfer")).not.toBeInTheDocument());
    await act(async () => fail(new Error("offline")));
    expect(await screen.findByText("Airport transfer")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to delete budget entry");
  });
});
