import type { ComponentType } from '@/simulation/types';
import { LEVELS, type Level } from './levels';

export interface DailyChallenge {
  id: string;
  date: string;
  level: Level;
  constraints: ChallengeConstraint[];
  bonusDescription: string;
  bonusMultiplier: number;
}

export interface ChallengeConstraint {
  id: string;
  type: 'component_limit' | 'time_limit' | 'mistake_limit' | 'resistor_range';
  description: string;
  componentType?: ComponentType;
  maxCount?: number;
  maxTime?: number;
  maxMistakes?: number;
  minResistance?: number;
  maxResistance?: number;
}

function dateToHash(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateComponentConstraint(hash: number, level: Level): ChallengeConstraint {
  const available = level.availableComponents.filter(
    (c) => c !== 'battery'
  );
  if (available.length === 0) {
    return {
      id: 'c1',
      type: 'mistake_limit',
      description: '限制失误次数：最多1次',
      maxMistakes: 1,
    };
  }
  const compIdx = hash % available.length;
  const compType = available[compIdx];
  const counts = [1, 2, 3];
  const maxCount = counts[(hash >> 3) % counts.length];
  return {
    id: `comp-${compType}`,
    type: 'component_limit',
    description: `限制元件数量：${componentName(compType)} 最多使用 ${maxCount} 个`,
    componentType: compType,
    maxCount,
  };
}

function componentName(type: ComponentType): string {
  const names: Record<ComponentType, string> = {
    battery: '电池',
    resistor: '电阻',
    capacitor: '电容',
    switch: '开关',
    bulb: '灯泡',
    wire_joint: '接线柱',
  };
  return names[type] ?? type;
}

function generateTimeConstraint(hash: number): ChallengeConstraint {
  const times = [45, 60, 90, 120];
  const idx = (hash >> 5) % times.length;
  const maxTime = times[idx];
  return {
    id: 'time-limit',
    type: 'time_limit',
    description: `时间限制：必须在 ${maxTime} 秒内完成`,
    maxTime,
  };
}

function generateMistakeConstraint(hash: number): ChallengeConstraint {
  const limits = [0, 1, 2];
  const idx = (hash >> 7) % limits.length;
  const maxMistakes = limits[idx];
  return {
    id: 'mistake-limit',
    type: 'mistake_limit',
    description: `失误限制：最多 ${maxMistakes} 次失误`,
    maxMistakes,
  };
}

export function generateDailyChallenge(date?: Date): DailyChallenge {
  const targetDate = date ?? new Date();
  const dateStr = formatDate(targetDate);
  const hash = dateToHash(dateStr);

  const levelIdx = hash % LEVELS.length;
  const level = LEVELS[levelIdx];

  const constraints: ChallengeConstraint[] = [];

  const constraintType = hash % 3;
  switch (constraintType) {
    case 0:
      constraints.push(generateComponentConstraint(hash, level));
      constraints.push(generateTimeConstraint(hash >> 2));
      break;
    case 1:
      constraints.push(generateTimeConstraint(hash));
      constraints.push(generateMistakeConstraint(hash >> 4));
      break;
    case 2:
      constraints.push(generateComponentConstraint(hash, level));
      constraints.push(generateMistakeConstraint(hash >> 3));
      break;
  }

  let bonusMultiplier = 1.5;
  const bonusDescriptions: string[] = [];
  for (const c of constraints) {
    bonusDescriptions.push(c.description);
  }
  const bonusDescription = `今日挑战：${level.name} - 额外约束：${bonusDescriptions.join('；')}`;

  if (constraints.some((c) => c.type === 'mistake_limit' && (c.maxMistakes ?? 99) <= 1)) {
    bonusMultiplier += 0.5;
  }
  if (constraints.some((c) => c.type === 'time_limit' && (c.maxTime ?? 999) <= 60)) {
    bonusMultiplier += 0.3;
  }

  return {
    id: `daily-${dateStr}`,
    date: dateStr,
    level,
    constraints,
    bonusDescription,
    bonusMultiplier,
  };
}

export function isTodayChallenge(challenge: DailyChallenge): boolean {
  return challenge.date === formatDate(new Date());
}

export function getChallengeIdForDate(date?: Date): string {
  const targetDate = date ?? new Date();
  return `daily-${formatDate(targetDate)}`;
}

export function verifyConstraint(
  constraint: ChallengeConstraint,
  params: {
    componentCounts?: Partial<Record<ComponentType, number>>;
    time?: number;
    mistakes?: number;
    resistances?: number[];
  }
): boolean {
  switch (constraint.type) {
    case 'component_limit': {
      if (!constraint.componentType || !params.componentCounts) return true;
      const count = params.componentCounts[constraint.componentType] ?? 0;
      return count <= (constraint.maxCount ?? 999);
    }
    case 'time_limit':
      return (params.time ?? 0) <= (constraint.maxTime ?? 9999);
    case 'mistake_limit':
      return (params.mistakes ?? 0) <= (constraint.maxMistakes ?? 999);
    case 'resistor_range': {
      if (!params.resistances || params.resistances.length === 0) return true;
      return params.resistances.every(
        (r) =>
          r >= (constraint.minResistance ?? 0) &&
          r <= (constraint.maxResistance ?? Infinity)
      );
    }
    default:
      return true;
  }
}

export function verifyAllConstraints(
  constraints: ChallengeConstraint[],
  params: Parameters<typeof verifyConstraint>[1]
): boolean {
  return constraints.every((c) => verifyConstraint(c, params));
}
