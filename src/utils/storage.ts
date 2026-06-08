export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return defaultValue;
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}
