"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import type { ReactNode } from "react";

import { Plus } from "@/ui/components/icon";

type AccordionItem = {
  value: string;
  trigger: ReactNode;
  content: ReactNode;
};

type AccordionProps = {
  items: ReadonlyArray<AccordionItem>;
};

function Accordion({ items }: AccordionProps) {
  return (
    <AccordionPrimitive.Root className="space-y-4 text-left">
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.value} value={item.value} className="overflow-hidden border-b">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group text-foreground focus-visible:ring-primary/60 flex w-full items-center justify-between gap-4 py-4 text-left text-lg leading-[1.3] font-semibold transition-colors duration-300 ease-out focus-visible:ring-2 focus-visible:outline-hidden">
              <span className="flex-1">{item.trigger}</span>
              <Plus
                className="size-5 shrink-0 transition-transform duration-300 ease-out group-data-panel-open:rotate-45"
                aria-hidden="true"
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Panel className="text-muted-foreground data-ending-style:animate-accordion-up data-starting-style:animate-accordion-down overflow-hidden transition-all duration-300 ease-out">
            <div className="pb-5">{item.content}</div>
          </AccordionPrimitive.Panel>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}

export { Accordion };
