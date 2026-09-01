"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button/Button";
import { Dialog, DialogContent, DialogHeader } from "@/shared/ui/dialog/Dialog";
import { Hourglass, Link2, Map as MapIcon, Upload } from "@/shared/ui/icon/lucide-icons";

type DemoGuideDialogProps = {
  isDemo: boolean;
};

function minutesUntilReset(): number {
  const now = new Date();
  const secondsUntilNextHour = 3600 - (now.getMinutes() * 60 + now.getSeconds());
  return Math.ceil(secondsUntilNextHour / 60);
}

// Explains the shared demo account on first visit. Everything a visitor does is
// wiped back to the curated baseline on the next hour. Dismissing it is per page
// visit so it doesn't nag, but still shows up before a stunned visitor guesses
// the wrong thing.
export function DemoGuideDialog({ isDemo }: DemoGuideDialogProps) {
  const [dismissed, setDismissed] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(minutesUntilReset);

  useEffect(() => {
    const interval = setInterval(() => setMinutesLeft(minutesUntilReset()), 10_000);
    return () => clearInterval(interval);
  }, []);

  if (!isDemo || dismissed) {
    return null;
  }

  const handleClose = () => setDismissed(true);

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-background w-[min(92vw,30rem)] max-h-[min(90vh,40rem)] overflow-y-auto p-6 sm:p-7">
        <DialogHeader
          visuallyHidden
          title="Welcome to the Turistar demo workspace"
          description="You can view, edit and create trips here. Everything you change is automatically reset every hour."
        />

        <div className="flex items-center gap-2">
          <MapIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
          <p className="text-foreground text-2xl font-semibold tracking-tight">
            Welcome to <span className="text-primary">Turistar</span>
          </p>
        </div>

        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          You can view, edit and create trips. All changes are automatically reset every hour.
        </p>

        <div className="from-primary/10 to-primary/5 mt-5 inline-flex items-center gap-2 self-start rounded-full bg-linear-to-r px-3 py-1.5">
          <Hourglass className="text-primary size-4" aria-hidden="true" />
          <span className="text-primary text-xs font-semibold tracking-wide">
            Resets in about {Math.max(0, minutesLeft)} min
          </span>
        </div>

        <section className="bg-card border-border mt-6 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">What is Turistar?</h2>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            A full-featured travel planner with real-time collaboration, itinerary, map, and budget in one
            place — and nothing locked behind paid plans.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            With a free account you also get:
          </h2>
          <ul className="mt-3 space-y-3">
            <li className="flex items-start gap-3">
              <Upload className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-sm">Upload custom photos for your activities.</span>
            </li>
            <li className="flex items-start gap-3">
              <Link2 className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-sm">Share plans and invite others to collaborate.</span>
            </li>
          </ul>
        </section>

        <Button onClick={handleClose} className="mt-7 w-full text-base font-semibold">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
