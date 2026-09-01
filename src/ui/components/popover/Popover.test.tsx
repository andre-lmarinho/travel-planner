import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Popover, PopoverContent, PopoverTriggerButton } from "@/ui/components/popover";

function PopoverExample() {
  return (
    <Popover>
      <PopoverTriggerButton>Open settings</PopoverTriggerButton>
      <PopoverContent
        title="Settings"
        side="right"
        align="start"
        sideOffset={8}
        data-testid="popover-content">
        <p>Popover body</p>
      </PopoverContent>
    </Popover>
  );
}

describe("Popover", () => {
  it("opens content from the trigger and closes from the header button", async () => {
    render(<PopoverExample />);

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(await screen.findByText("Popover body")).toBeInTheDocument();
    expect(screen.getByTestId("popover-content")).toHaveAttribute("data-side", "right");
    expect(screen.getByTestId("popover-content")).toHaveAttribute("data-align", "start");
    expect(screen.getByTestId("popover-content").parentElement).toHaveClass("z-60");

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(screen.queryByText("Popover body")).toBeNull());
  });
});
