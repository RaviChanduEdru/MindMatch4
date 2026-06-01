export function readStoredString(key, fallbackValue) {
  if (typeof window === "undefined") return fallbackValue;
  try {
    const value = window.localStorage?.getItem(key);
    return value ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function readStoredJSON(key, fallbackValue) {
  const raw = readStoredString(key, null);
  if (raw == null) return fallbackValue;
  try {
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}
