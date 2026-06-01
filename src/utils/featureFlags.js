const TRUTHY = new Set(["1", "true", "on", "yes", "enabled"]);
const FALSY = new Set(["0", "false", "off", "no", "disabled"]);

const DEFAULT_FLAGS = Object.freeze({
  hero3d: true,
  overlaysV2: false,
  dashboardV2: false,
  boardFxV2: false,
});

function parseFlagValue(raw) {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toLowerCase();
  if (TRUTHY.has(normalized)) return true;
  if (FALSY.has(normalized)) return false;
  return null;
}

function readUrlOverride(flagName) {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const direct = parseFlagValue(params.get(`ff_${flagName}`));
  if (direct !== null) return direct;
  return parseFlagValue(params.get(`mm4_ff_${flagName}`));
}

function readStorageOverride(flagName) {
  if (typeof window === "undefined") return null;
  try {
    return parseFlagValue(localStorage.getItem(`mm4_ff_${flagName}`));
  } catch {
    return null;
  }
}

export function getFeatureFlags() {
  const resolved = { ...DEFAULT_FLAGS };
  Object.keys(DEFAULT_FLAGS).forEach((name) => {
    const fromUrl = readUrlOverride(name);
    const fromStorage = readStorageOverride(name);
    if (fromUrl !== null) resolved[name] = fromUrl;
    else if (fromStorage !== null) resolved[name] = fromStorage;
  });
  return resolved;
}

export function setFeatureFlag(flagName, value) {
  if (typeof window === "undefined") return;
  if (!(flagName in DEFAULT_FLAGS)) return;
  const normalized = value ? "1" : "0";
  try {
    localStorage.setItem(`mm4_ff_${flagName}`, normalized);
  } catch {
    // Ignore write failures (private mode / restricted storage).
  }
}

export function getDefaultFlags() {
  return { ...DEFAULT_FLAGS };
}
