import { describe, expect, it } from "vitest";

import { ApplicationError } from "./ApplicationError";
import { formatSupabaseError, SupabaseError } from "./SupabaseError";

describe("SupabaseError", () => {
  it("is an ApplicationError and an Error", () => {
    const err = new SupabaseError("fetchPlan");

    expect(err).toBeInstanceOf(SupabaseError);
    expect(err).toBeInstanceOf(ApplicationError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("SupabaseError");
  });

  it("is always an INTERNAL_SERVER_ERROR technical failure", () => {
    expect(new SupabaseError("op").code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("reports the failing operation and identifies itself in the message", () => {
    const err = new SupabaseError("fetchPlanBudgetRow", { planId: "abc", n: 5 });

    expect(err.operation).toBe("fetchPlanBudgetRow");
    expect(err.identifiers).toEqual({ planId: "abc", n: 5 });
    expect(err.message).toContain("fetchPlanBudgetRow");
    expect(err.message).toContain("planId=abc");
    expect(err.message).toContain("n=5");
  });

  it("omits blank identifiers and undefined values", () => {
    expect(new SupabaseError("op").identifiers).toEqual({});
    expect(new SupabaseError("op", { a: undefined }).message).not.toContain("a=");
  });

  it("keeps the technical cause internal and out of the public message", () => {
    const cause = new Error("raw supabase failure detail");
    const err = new SupabaseError("op", {}, { cause });

    expect(err.cause).toBe(cause);
    expect(err.message).toBe("Supabase error during op. raw supabase failure detail");
  });

  it("formats a Supabase error record cause with message/details/hint/code", () => {
    const err = new SupabaseError(
      "op",
      {},
      {
        cause: { message: "relation does not exist", details: "42P01", hint: "check schema", code: "42P01" },
      }
    );

    expect(err.message).toContain("relation does not exist");
    expect(err.message).toContain("42P01");
    expect(err.message).toContain("check schema");
  });
});

describe("formatSupabaseError", () => {
  it("builds a SupabaseError with operation, identifiers and cause", () => {
    const cause = new Error("boom");
    const err = formatSupabaseError({ operation: "fetchEvents", identifiers: { planId: "x" }, error: cause });

    expect(err).toBeInstanceOf(SupabaseError);
    expect(err.operation).toBe("fetchEvents");
    expect(err.identifiers).toEqual({ planId: "x" });
    expect(err.cause).toBe(cause);
  });
});
