import levelsRaw from '../config/levels.json';
import reagentsRaw from '../config/reagents.json';
import equipmentRaw from '../config/equipment.json';
import reactionsRaw from '../config/reactions.json';
import type {
  LevelConfig,
  ReagentConfig,
  EquipmentConfig,
  ReactionConfig,
} from '../types/config';

export const LEVELS: LevelConfig[] = levelsRaw as LevelConfig[];
export const REAGENTS: ReagentConfig[] = reagentsRaw as ReagentConfig[];
export const EQUIPMENT: EquipmentConfig[] = equipmentRaw as EquipmentConfig[];
export const REACTIONS: ReactionConfig[] = reactionsRaw as ReactionConfig[];

export const getLevelById = (id: string): LevelConfig | undefined =>
  LEVELS.find(l => l.id === id);

export const getReagentById = (id: string): ReagentConfig | undefined =>
  REAGENTS.find(r => r.id === id);

export const getEquipmentById = (id: string): EquipmentConfig | undefined =>
  EQUIPMENT.find(e => e.id === id);

export const getReactionById = (id: string): ReactionConfig | undefined =>
  REACTIONS.find(r => r.id === id);

export const validateLevelConfig = (level: LevelConfig): string[] => {
  const errors: string[] = [];

  if (!level.id || level.id.length < 2) errors.push('Level id is invalid');
  if (!level.name) errors.push('Level name is required');
  if (!level.steps || level.steps.length === 0) {
    errors.push('Level must have at least one step');
  }

  level.availableReagents.forEach(rid => {
    if (!getReagentById(rid)) errors.push(`Unknown reagent id: ${rid}`);
  });
  level.availableEquipment.forEach(eid => {
    if (!getEquipmentById(eid)) errors.push(`Unknown equipment id: ${eid}`);
  });

  if (level.starThresholds.length !== 3) {
    errors.push('starThresholds must contain exactly 3 values');
  }
  if (level.starThresholds[0] >= level.starThresholds[1] ||
      level.starThresholds[1] >= level.starThresholds[2] ||
      level.starThresholds[2] > level.maxScore) {
    errors.push('starThresholds must be ascending and <= maxScore');
  }

  return errors;
};

export const validateAllConfigs = (): { levels: Record<string, string[]>; ok: boolean } => {
  const result: Record<string, string[]> = {};
  let ok = true;
  LEVELS.forEach(level => {
    const errs = validateLevelConfig(level);
    if (errs.length > 0) {
      result[level.id] = errs;
      ok = false;
    }
  });
  return { levels: result, ok };
};

export const getLevelsByDifficulty = (diff: number): LevelConfig[] =>
  LEVELS.filter(l => l.difficulty === diff);

export const getNextLevel = (currentId: string): LevelConfig | undefined => {
  const idx = LEVELS.findIndex(l => l.id === currentId);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : undefined;
};

export const isLevelUnlocked = (
  levelId: string,
  progress: { levelId: string; completed: boolean }[],
): boolean => {
  const level = getLevelById(levelId);
  if (!level) return false;
  if (!level.prerequisiteLevels || level.prerequisiteLevels.length === 0) return true;
  return level.prerequisiteLevels.every(pre => {
    const p = progress.find(x => x.levelId === pre);
    return p?.completed;
  });
};
