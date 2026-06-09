import type { TowerDefinition } from '@/types';

export const TOWER_CONFIGS: Record<string, TowerDefinition> = {
  sniper: {
    type: 'sniper',
    name: '狙击塔',
    description: '高精度远程攻击，单体高伤害，对远距离敌人尤为有效',
    icon: '🎯',
    color: '#4ecdc4',
    damageType: 'physical',
    targeting: ['furthest', 'first', 'strongest'],
    levels: [
      { level: 1, stats: { damage: 50, range: 260, fireRate: 0.8, cost: 100, projectileSpeed: 600 }, upgradeCost: 120 },
      { level: 2, stats: { damage: 85, range: 300, fireRate: 1.0, cost: 0, projectileSpeed: 700 }, upgradeCost: 180 },
      { level: 3, stats: { damage: 150, range: 340, fireRate: 1.2, cost: 0, projectileSpeed: 800 }, upgradeCost: 0 },
    ],
  },
  cannon: {
    type: 'cannon',
    name: '炮台',
    description: '发射炮弹造成范围伤害，适合清理密集敌群',
    icon: '💣',
    color: '#ff6b6b',
    damageType: 'physical',
    targeting: ['first', 'strongest'],
    levels: [
      { level: 1, stats: { damage: 35, range: 180, fireRate: 0.5, cost: 150, splashRadius: 50, projectileSpeed: 350 }, upgradeCost: 180 },
      { level: 2, stats: { damage: 60, range: 200, fireRate: 0.65, cost: 0, splashRadius: 65, projectileSpeed: 380 }, upgradeCost: 260 },
      { level: 3, stats: { damage: 110, range: 220, fireRate: 0.8, cost: 0, splashRadius: 85, projectileSpeed: 420 }, upgradeCost: 0 },
    ],
  },
  frost: {
    type: 'frost',
    name: '冰霜塔',
    description: '攻击附加减速效果，降低敌人移动速度',
    icon: '❄️',
    color: '#74b9ff',
    damageType: 'ice',
    targeting: ['first', 'closest'],
    effects: [{ id: 'slow', type: 'slow', duration: 2.5, multiplier: 0.55 }],
    levels: [
      { level: 1, stats: { damage: 15, range: 200, fireRate: 1.2, cost: 120, projectileSpeed: 450 }, upgradeCost: 150 },
      { level: 2, stats: { damage: 28, range: 220, fireRate: 1.4, cost: 0, projectileSpeed: 500 }, upgradeCost: 220 },
      { level: 3, stats: { damage: 50, range: 250, fireRate: 1.6, cost: 0, projectileSpeed: 550 }, upgradeCost: 0 },
    ],
  },
  poison: {
    type: 'poison',
    name: '毒雾塔',
    description: '释放剧毒，持续对敌人造成伤害，对高血量敌人有效',
    icon: '☠️',
    color: '#a8e063',
    damageType: 'poison',
    targeting: ['first', 'strongest'],
    effects: [{ id: 'poison', type: 'poison', duration: 5, value: 8 }],
    levels: [
      { level: 1, stats: { damage: 8, range: 170, fireRate: 1.0, cost: 140, projectileSpeed: 400 }, upgradeCost: 170 },
      { level: 2, stats: { damage: 14, range: 190, fireRate: 1.15, cost: 0, projectileSpeed: 440 }, upgradeCost: 240 },
      { level: 3, stats: { damage: 24, range: 210, fireRate: 1.3, cost: 0, projectileSpeed: 480 }, upgradeCost: 0 },
    ],
  },
  tesla: {
    type: 'tesla',
    name: '闪电塔',
    description: '释放链式闪电，可同时攻击多个敌人',
    icon: '⚡',
    color: '#ffeaa7',
    damageType: 'energy',
    targeting: ['first', 'closest'],
    levels: [
      { level: 1, stats: { damage: 28, range: 190, fireRate: 0.9, cost: 180 }, upgradeCost: 220 },
      { level: 2, stats: { damage: 48, range: 210, fireRate: 1.0, cost: 0 }, upgradeCost: 320 },
      { level: 3, stats: { damage: 85, range: 240, fireRate: 1.2, cost: 0 }, upgradeCost: 0 },
    ],
  },
  barrier: {
    type: 'barrier',
    name: '路障塔',
    description: '在路径上设置路障，大幅降低附近敌人移动速度',
    icon: '🚧',
    color: '#fab1a0',
    damageType: 'physical',
    targeting: ['first'],
    levels: [
      { level: 1, stats: { damage: 5, range: 80, fireRate: 0.4, cost: 80 }, upgradeCost: 100 },
      { level: 2, stats: { damage: 10, range: 100, fireRate: 0.5, cost: 0 }, upgradeCost: 150 },
      { level: 3, stats: { damage: 20, range: 120, fireRate: 0.6, cost: 0 }, upgradeCost: 0 },
    ],
  },
};

export function getTowerConfig(type: string): TowerDefinition {
  return TOWER_CONFIGS[type];
}

export function getTowerStats(type: string, level: number) {
  const def = TOWER_CONFIGS[type];
  if (!def) return null;
  return def.levels[Math.min(level - 1, def.levels.length - 1)].stats;
}

export function getTowerUpgradeCost(type: string, currentLevel: number): number {
  const def = TOWER_CONFIGS[type];
  if (!def) return 0;
  if (currentLevel >= def.levels.length) return 0;
  return def.levels[currentLevel - 1].upgradeCost;
}

export function getTowerSellValue(type: string, level: number): number {
  const def = TOWER_CONFIGS[type];
  if (!def) return 0;
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += def.levels[i].stats.cost;
    if (i > 0) total += def.levels[i - 1].upgradeCost;
  }
  return Math.floor(total * 0.65);
}
