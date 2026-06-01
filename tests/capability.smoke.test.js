import { detectVisualTier } from "../src/utils/capability.js";

describe("capability tier fallback smoke", () => {
  test("returns fallback tier in non-browser environments", () => {
    const caps = detectVisualTier();
    expect(caps.tier).toBe("fallback");
    expect(typeof caps.reason).toBe("string");
  });
});
