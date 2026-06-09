export interface LevelRecord {
  levelId: string;
  completed: boolean;
  stars: number;
  mistakes: number;
  time: number;
  completedAt: number;
}

export interface SaveDataLite {
  achievements?: string[];
  levelRecords?: Record<string, LevelRecord>;
  totalBulbsLit?: number;
  totalShortCircuits?: number;
  resistorsUsed?: number;
  capacitorsUsed?: number;
  perfectLevels?: number;
  levelsCompleted?: number;
  threeStarLevels?: number;
  sandboxComponents?: number;
  dailyPlayStreak?: number;
  lastPlayDate?: string;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (saveData: SaveDataLite) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_bulb',
    name: '点亮首灯',
    desc: '在电路中成功点亮第一颗灯泡',
    icon: '💡',
    check: (sd: SaveDataLite): boolean => (sd.totalBulbsLit ?? 0) >= 1,
  },
  {
    id: 'three_bulbs',
    name: '三灯齐亮',
    desc: '同时点亮三颗灯泡',
    icon: '✨',
    check: (sd: SaveDataLite): boolean => (sd.totalBulbsLit ?? 0) >= 3,
  },
  {
    id: 'flawless',
    name: '无失误通关',
    desc: '零失误完成任意一个关卡',
    icon: '🎯',
    check: (sd: SaveDataLite): boolean => {
      const records = Object.values(sd.levelRecords ?? {});
      return records.some((r) => r.completed && r.mistakes === 0);
    },
  },
  {
    id: 'resistor_artist',
    name: '电阻艺术家',
    desc: '累计使用超过20个电阻',
    icon: '🎨',
    check: (sd: SaveDataLite): boolean => (sd.resistorsUsed ?? 0) >= 20,
  },
  {
    id: 'capacitor_pioneer',
    name: '电容先锋',
    desc: '首次使用电容完成RC延时电路',
    icon: '⚡',
    check: (sd: SaveDataLite): boolean => (sd.capacitorsUsed ?? 0) >= 1,
  },
  {
    id: 'zero_mistake_master',
    name: '零失误大师',
    desc: '累计完成5个零失误关卡',
    icon: '👑',
    check: (sd: SaveDataLite): boolean => (sd.perfectLevels ?? 0) >= 5,
  },
  {
    id: 'speed_runner',
    name: '速通王',
    desc: '在30秒内完成任意关卡',
    icon: '⚡',
    check: (sd: SaveDataLite): boolean => {
      const records = Object.values(sd.levelRecords ?? {});
      return records.some((r) => r.completed && r.time > 0 && r.time < 30);
    },
  },
  {
    id: 'sandbox_architect',
    name: '沙盒建筑师',
    desc: '在沙盒模式中放置超过50个元件',
    icon: '🏗️',
    check: (sd: SaveDataLite): boolean => (sd.sandboxComponents ?? 0) >= 50,
  },
  {
    id: 'three_day_streak',
    name: '连续三日',
    desc: '连续三天登录游戏',
    icon: '📅',
    check: (sd: SaveDataLite): boolean => (sd.dailyPlayStreak ?? 0) >= 3,
  },
  {
    id: 'perfectionist',
    name: '完美主义',
    desc: '获得5个关卡的三星评价',
    icon: '⭐',
    check: (sd: SaveDataLite): boolean => (sd.threeStarLevels ?? 0) >= 5,
  },
  {
    id: 'explorer',
    name: '探索者',
    desc: '完成全部10个关卡',
    icon: '🗺️',
    check: (sd: SaveDataLite): boolean => (sd.levelsCompleted ?? 0) >= 10,
  },
  {
    id: 'short_circuit_researcher',
    name: '短路研究员',
    desc: '触发短路超过10次（科学需要探索！）',
    icon: '🔬',
    check: (sd: SaveDataLite): boolean => (sd.totalShortCircuits ?? 0) >= 10,
  },
];

export const ACHIEVEMENTS_MAP: Record<string, Achievement> = ACHIEVEMENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, Achievement>
);

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS_MAP[id];
}

export function checkAllAchievements(saveData: SaveDataLite): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(saveData)).map((a) => a.id);
}
