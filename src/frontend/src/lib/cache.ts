// A tiny memory for pages. It keeps the last answer for each thing (your groups, a group's movies...)
// so a page can show it at once while fresh data loads in the background.
// It lives only while the app is open and nothing is saved in the browser.
const store = new Map<string, unknown>();

// Returns what we remembered under this name, or undefined if nothing.
export function getCached<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCached(key: string, value: unknown): void {
  store.set(key, value);
}

// Forgets one thing, for when we know it just went out of date.
export function forget(key: string): void {
  store.delete(key);
}

// Forgets everything. Called on login and logout so one person never sees another's data.
export function clearCache(): void {
  store.clear();
}
