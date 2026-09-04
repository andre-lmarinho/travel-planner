import { describe, expect, it } from "vitest";

import { parsePosition } from "./gapOrdering";

describe("parsePosition", () => {
  it("treats blank positions as missing", () => {
    expect(parsePosition("")).toBeNull();
    expect(parsePosition("   ")).toBeNull();
  });
});
