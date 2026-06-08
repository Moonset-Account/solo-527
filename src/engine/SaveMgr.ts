import type { SaveData } from '@/types';

const STORAGE_PREFIX = 'traffic_sim_';
const SAVE_SLOTS = ['slot1', 'slot2', 'slot3'] as const;

function storageKey(slot: string): string {
  return `${STORAGE_PREFIX}${slot}`;
}

function isSaveData(data: unknown): data is SaveData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.levelId === 'string' &&
    typeof d.timestamp === 'number' &&
    typeof d.gameTime === 'number' &&
    Array.isArray(d.intersections) &&
    typeof d.stats === 'object' &&
    d.stats !== null &&
    typeof d.speed === 'number'
  );
}

export function save(slot: string, data: SaveData): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(storageKey(slot), json);
  } catch {
    console.error(`Failed to save to slot "${slot}"`);
  }
}

export function load(slot: string): SaveData | null {
  try {
    const raw = localStorage.getItem(storageKey(slot));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSaveData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function deleteSave(slot: string): void {
  localStorage.removeItem(storageKey(slot));
}

export function listSaves(): { slot: string; data: SaveData | null }[] {
  return SAVE_SLOTS.map((slot) => ({ slot, data: load(slot) }));
}

export function exportSave(data: SaveData): string {
  return JSON.stringify(data);
}

export function importSave(json: string): SaveData | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return isSaveData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getLatestSave(): SaveData | null {
  let latest: SaveData | null = null;
  for (const slot of SAVE_SLOTS) {
    const data = load(slot);
    if (data && (!latest || data.timestamp > latest.timestamp)) {
      latest = data;
    }
  }
  return latest;
}
