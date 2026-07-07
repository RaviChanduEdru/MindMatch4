/**
 * Stroop Test — a word naming a color is shown in a possibly-different ink color.
 * Player must tap the INK COLOR (not the word). Trains cognitive control.
 */

export const COLORS = [
  { id: "red",    label: "Red",    hex: "#e74c3c" },
  { id: "blue",   label: "Blue",   hex: "#3498db" },
  { id: "green",  label: "Green",  hex: "#2ecc71" },
  { id: "yellow", label: "Yellow", hex: "#f1c40f" },
];

export const TIME_SEC = 45;
export const BEST_KEY = "mm4_stroop_best";
export const loadBest = () => Number(localStorage.getItem(BEST_KEY) || 0);
export const saveBest = (s) => localStorage.setItem(BEST_KEY, String(s));

export function nextTrial(prev) {
  // Decide the trial type up front so the classic ~65% conflict / 35%
  // congruent ratio actually holds. (Previously word and ink were both
  // random, which is congruent only ~25% of the time, so nearly every trial
  // ended up as conflict.)
  let word, ink, attempts = 0;
  do {
    word = COLORS[Math.floor(Math.random() * COLORS.length)];
    if (Math.random() < 0.35) {
      // Congruent: ink matches the word.
      ink = word;
    } else {
      // Conflict: pick a random ink among the other colors (unbiased).
      const others = COLORS.filter((c) => c.id !== word.id);
      ink = others[Math.floor(Math.random() * others.length)];
    }
    attempts++;
  } while (
    prev && word.id === prev.word.id && ink.id === prev.ink.id && attempts < 5
  );
  return { word, ink, answer: ink.id };
}
