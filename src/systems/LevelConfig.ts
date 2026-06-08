import type { LevelConfig } from '@/types';

const levelCache = new Map<string, LevelConfig>();

export async function loadLevel(levelId: string): Promise<LevelConfig | null> {
  if (levelCache.has(levelId)) {
    return levelCache.get(levelId)!;
  }
  try {
    const resp = await fetch(`/src/data/levels/${levelId}.json`);
    if (!resp.ok) return null;
    const data: LevelConfig = await resp.json();
    levelCache.set(levelId, data);
    return data;
  } catch {
    return null;
  }
}

export function loadLevelSync(levelId: string): LevelConfig | null {
  return levelCache.get(levelId) ?? null;
}

export function cacheLevel(config: LevelConfig): void {
  levelCache.set(config.id, config);
}

export function clearCache(): void {
  levelCache.clear();
}
