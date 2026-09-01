import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip } from "@/ui/components/tooltip";

describe("Tooltip", () => {
  it("renders content when the trigger receives focus", async () => {
    render(
      <Tooltip content="Toggle visibility" delayDuration={0} position="bottom">
        <button type="button">Show password</button>
      </Tooltip>
    );

    fireEvent.focus(screen.getByRole("button", { name: "Show password" }));

    expect(await screen.findByText("Toggle visibility")).toBeInTheDocument();
  });
});
