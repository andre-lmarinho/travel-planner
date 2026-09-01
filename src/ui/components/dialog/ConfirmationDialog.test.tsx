import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmationDialog } from "@/ui/components/dialog/ConfirmationDialog";

describe("ConfirmationDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens with an accessible title and description", () => {
    render(
      <ConfirmationDialog
        trigger={<button type="button">Delete trip</button>}
        title="Delete planner"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete trip" }));

    expect(screen.getByRole("alertdialog", { name: "Delete planner" })).toHaveAccessibleDescription(
      "This action cannot be undone."
    );
  });

  it("confirms the action and closes after success", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ConfirmationDialog
        trigger={<button type="button">Delete trip</button>}
        title="Delete planner"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete trip" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete planner" })).toBeNull());
  });

  it("keeps the dialog open when confirmation fails", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Deletion failed"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ConfirmationDialog
        trigger={<button type="button">Delete trip</button>}
        title="Delete planner"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete trip" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());

    expect(screen.getByRole("alertdialog", { name: "Delete planner" })).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith("Confirmation action failed:", {
      message: "Deletion failed",
    });
  });
});
