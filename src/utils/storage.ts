export const MEDICINE_CATEGORIES_KEY = 'pharmacy_medicine_categories'
export const AUTH_USER_KEY = 'auth_user'
export const UI_PREFERENCES_KEY = 'pharmacy_ui_preferences'

export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as T
    }
  } catch {
    // ignore
  }
  return defaultValue
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
