import { describe, expect, it } from "vitest";

import { ApplicationError } from "./ApplicationError";

describe("ApplicationError", () => {
  it("exposes the semantic code and a safe public message", () => {
    const err = new ApplicationError("NOT_FOUND", "Plan not found.");

    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Plan not found.");
    expect(err.name).toBe("ApplicationError");
    expect(err).toBeInstanceOf(Error);
  });

  it("keeps the technical cause internal and distinct from the message", () => {
    const cause = new Error("raw supabase error");
    const err = new ApplicationError("INTERNAL_SERVER_ERROR", "Something went wrong.", { cause });

    expect(err.message).toBe("Something went wrong.");
    expect(err.message).not.toContain("raw supabase error");
    expect(err.cause).toBe(cause);
  });

  it("supports every defined code", () => {
    const codes = [
      "BAD_REQUEST",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "TOO_MANY_REQUESTS",
      "INTERNAL_SERVER_ERROR",
    ] as const;

    for (const code of codes) {
      expect(new ApplicationError(code, "m").code).toBe(code);
    }
  });
});
