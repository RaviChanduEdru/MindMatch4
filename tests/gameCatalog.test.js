import {
  GAMES,
  GAME_ROUTES,
  getGameRoute,
  getGameIdFromRoute,
} from "../src/utils/gameCatalog.js";

test("every game id round-trips through its route slug", () => {
  for (const game of GAMES) {
    const route = getGameRoute(game.id);
    expect(getGameIdFromRoute(route)).toBe(game.id);
  }
});

test("every game has a route mapping", () => {
  for (const game of GAMES) {
    expect(GAME_ROUTES[game.id]).toBeTruthy();
  }
});

test("route lookups are case-insensitive", () => {
  const [id, slug] = Object.entries(GAME_ROUTES)[0];
  expect(getGameIdFromRoute(slug.toUpperCase())).toBe(id);
});

test("unknown or empty routes resolve to null", () => {
  expect(getGameIdFromRoute("nonexistent")).toBeNull();
  expect(getGameIdFromRoute("")).toBeNull();
  expect(getGameIdFromRoute(undefined)).toBeNull();
});
