import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Activity, DayPlan } from "@/features/activity/types";

import { ActivityDialog } from "./ActivityDialog";

afterEach(() => vi.unstubAllGlobals());

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
  it("commits place details together with the current draft, without saving again on blur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) =>
          new Response(
            JSON.stringify(
              url.startsWith("/api/places/details")
                ? {
                    details: { formatted: "Museum address", description: "Museum notes" },
                    wikidataImageUrl: "https://example.com/museum.jpg",
                  }
                : {
                    results: [
                      {
                        placeId: "museum",
                        name: "Museum",
                        formatted: "Museum address",
                        latitude: 1,
                        longitude: 2,
                      },
                    ],
                  }
            )
          )
      )
    );
    const onSave = vi.fn();
    render(<ActivityDialog activity={activity} days={days} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Budget amount"), { target: { value: "25" } });
    const title = screen.getByRole("combobox", { name: "Title" });
    fireEvent.focus(title);
    fireEvent.mouseDown(await screen.findByRole("option", { name: /Museum/ }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Museum",
          address: "Museum address",
          description: "Museum notes",
          budget: 25,
          latitude: 1,
          longitude: 2,
          imageUrl: "https://example.com/museum.jpg",
        })
      )
    );
    expect(screen.getByLabelText("Notes")).toHaveValue("Museum notes");
    fireEvent.blur(title);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  });

  it("does not save an unchanged draft when optional fields are absent", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ActivityDialog activity={activity} days={days} onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(onSave).not.toHaveBeenCalled();
  });

  it("submits synchronously on blur and does not submit again on Done", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ActivityDialog activity={activity} days={days} onSave={onSave} onClose={onClose} />);
    const title = screen.getByRole("combobox", { name: "Title" });
    fireEvent.change(title, { target: { value: "Updated" } });
    fireEvent.blur(title);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it.each([
    ["Duration in hours", "duration"],
    ["Budget amount", "budget"],
  ])("updates and clears %s without changing the other numeric field", (label, field) => {
    const onSave = vi.fn();
    render(<ActivityDialog activity={activity} days={days} onSave={onSave} onClose={vi.fn()} />);
    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value: "0" } });
    expect(input).toHaveValue(0);
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "0.5" } });
    expect(input).toHaveValue(0.5);
    expect(input).toBeValid();
    fireEvent.blur(input);
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({ duration: 0, budget: 0, [field]: 0.5 })
    );
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ duration: 0, budget: 0 }));
  });

  it("discards uncommitted edits on Cancel", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ActivityDialog activity={activity} days={days} onSave={onSave} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Discard me" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Notes")).toHaveValue("");
  });

  it("reverts to the last submitted draft on Escape", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ActivityDialog activity={activity} days={days} onSave={onSave} onClose={onClose} />);
    const title = screen.getByRole("combobox", { name: "Title" });
    fireEvent.change(title, { target: { value: "Confirmed" } });
    fireEvent.blur(title);
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    fireEvent.change(title, { target: { value: "Discard me" } });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(title).toHaveValue("Confirmed"));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("persists removing a photo as an empty image URL", async () => {
    const onSave = vi.fn();
    render(
      <ActivityDialog
        activity={{ ...activity, imageUrl: "https://example.com/photo.jpg" }}
        days={days}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: "" })));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

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
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("dayId");
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("id");
  });
});
