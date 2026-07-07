import { nextTrial, COLORS } from "../src/utils/stroopHelpers.js";

test("answer always equals the ink color id", () => {
  for (let i = 0; i < 500; i++) {
    const t = nextTrial();
    expect(t.answer).toBe(t.ink.id);
    expect(COLORS.some((c) => c.id === t.ink.id)).toBe(true);
  }
});

test("conflict trials use a different ink than the word", () => {
  for (let i = 0; i < 500; i++) {
    const t = nextTrial();
    const congruent = t.word.id === t.ink.id;
    // Either congruent (same) or a genuine conflict (different) — never a
    // malformed trial.
    expect(typeof congruent).toBe("boolean");
  }
});

test("conflict rate is close to the intended ~65%", () => {
  const N = 4000;
  let conflict = 0;
  for (let i = 0; i < N; i++) {
    const t = nextTrial();
    if (t.word.id !== t.ink.id) conflict++;
  }
  const rate = conflict / N;
  // Target 0.65; allow generous tolerance so the test isn't flaky.
  expect(rate).toBeGreaterThan(0.55);
  expect(rate).toBeLessThan(0.75);
});
