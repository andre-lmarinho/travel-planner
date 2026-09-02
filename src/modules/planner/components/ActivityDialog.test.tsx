import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Activity, DayPlan } from "@/features/activity/types";

import { ActivityDialog } from "./ActivityDialog";

const activity: Activity & { dayId: string } = {
  id: "activity-1",
  dayId: "day-1",
  title: "Visit museum",
  color: "bg-[var(--color-1)]",
};

const days: DayPlan[] = [
  {
    id: "day-1",
    label: "Day 1",
    activities: [activity],
  },
];

describe("ActivityDialog", () => {
  it("provides an accessible description", () => {
    render(<ActivityDialog activity={activity} days={days} onSave={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Edit Activity" })).toHaveAccessibleDescription(
      "Edit the selected activity title, schedule position, location, notes, budget, and visual details."
    );
  });

  it("saves edited fields before closing with Done", async () => {
    const onSave = vi.fn();
    render(<ActivityDialog activity={activity} days={days} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Title" }), {
      target: { value: "Updated museum" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Updated museum" }))
    );
  });
});
