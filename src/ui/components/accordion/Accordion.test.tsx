import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Accordion } from "@/ui/components/accordion";

const items = [
  {
    value: "first",
    trigger: "First question",
    content: "First answer",
  },
  {
    value: "second",
    trigger: "Second question",
    content: "Second answer",
  },
];

function AccordionExample() {
  return <Accordion items={items} />;
}

describe("Accordion", () => {
  it("opens and closes a collapsible item", () => {
    render(<AccordionExample />);

    const trigger = screen.getByRole("button", { name: "First question" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps only one item open in single mode", () => {
    render(<AccordionExample />);

    const first = screen.getByRole("button", { name: "First question" });
    const second = screen.getByRole("button", { name: "Second question" });

    fireEvent.click(first);
    fireEvent.click(second);

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });
});
