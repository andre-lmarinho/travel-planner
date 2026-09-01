"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/supabase/client";

import type { EventRecord } from "../types";
import { EventRowSchema, mapEvent } from "./eventsSchemas";

type PlannerRealtimeChannel = ReturnType<SupabaseClient["channel"]>;

export function subscribeToEvents(
  planId: string,
  handler: (event: EventRecord) => void,
  client: SupabaseClient = supabase
): PlannerRealtimeChannel {
  const channel = client
    .channel(`plan-events-${planId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "plan_events", filter: `plan_id=eq.${planId}` },
      (payload: { new: unknown }) => {
        const result = EventRowSchema.safeParse(payload.new);
        if (result.success) {
          handler(mapEvent(result.data));
        } else {
          console.error("Failed to parse event payload:", result.error);
        }
      }
    )
    .subscribe();
  return channel;
}
