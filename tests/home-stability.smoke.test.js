import { readStoredJSON, readStoredString } from "../src/utils/homeStability.js";

describe("home stability smoke", () => {
  test("safe string reader falls back when storage is unavailable", () => {
    expect(readStoredString("mm4_age_group", "all")).toBe("all");
  });

  test("safe JSON reader falls back when storage is unavailable", () => {
    expect(readStoredJSON("mm4_kids_mode", false)).toBe(false);
  });
});
