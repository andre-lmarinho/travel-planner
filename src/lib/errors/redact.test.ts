import { describe, expect, it } from "vitest";

import { isSecretKey, redactIfSecret, redactRecord, redactUrl } from "./redact";

describe("isSecretKey", () => {
  it.each([
    "password",
    "passwd",
    "secret",
    "token",
    "apiKey",
    "apikey",
    "service_role_key",
    "authorization",
    "cookie",
    "session",
  ])("flags %s as secret", (key) => {
    expect(isSecretKey(key)).toBe(true);
  });

  it.each(["planId", "email", "title", "amount"])("does not flag %s as secret", (key) => {
    expect(isSecretKey(key)).toBe(false);
  });
});

describe("redactIfSecret", () => {
  it("redacts secret-keyed values and passes others through", () => {
    expect(redactIfSecret("api_key", "sk-123")).toBe("[REDACTED]");
    expect(redactIfSecret("planId", "abc-123")).toBe("abc-123");
  });
});

describe("redactRecord", () => {
  it("returns a new object with secret keys redacted, one level deep", () => {
    const input = {
      planId: "abc",
      apiKey: "sk-secret",
      nested: { token: "deep-secret" },
    };

    const output = redactRecord(input);

    expect(output).toEqual({
      planId: "abc",
      apiKey: "[REDACTED]",
      nested: { token: "deep-secret" },
    });
    expect(output).not.toBe(input);
  });

  it("never leaks the secret value anywhere in the output", () => {
    const output = JSON.stringify(redactRecord({ apiKey: "sk-secret", other: "keep" }));
    expect(output).not.toContain("sk-secret");
    expect(output).toContain("keep");
  });
});

describe("redactUrl", () => {
  it("redacts query token params", () => {
    expect(redactUrl("https://x.test/path?token=abc&api_key=def&x=1")).toBe(
      "https://x.test/path?token=[REDACTED]&api_key=[REDACTED]&x=1"
    );
  });

  it("redacts userinfo credentials", () => {
    expect(redactUrl("https://user:pw@host/path")).toBe("https://[REDACTED]@host/path");
  });

  it("leaves plain urls untouched", () => {
    expect(redactUrl("https://host/path?planId=abc")).toBe("https://host/path?planId=abc");
  });
});
