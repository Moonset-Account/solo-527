import type { EnemyDefinition } from '@/types';

export const ENEMY_CONFIGS: Record<string, EnemyDefinition> = {
  scout: {
    type: 'scout',
    name: '侦察车',
    hp: 60,
    speed: 110,
    reward: 8,
    damage: 1,
    color: '#55efc4',
    size: 14,
    resistances: {},
    weak: { poison: 1.4 },
  },
  truck: {
    type: 'truck',
    name: '运输车',
    hp: 160,
    speed: 70,
    reward: 15,
    damage: 2,
    color: '#74b9ff',
    size: 18,
    resistances: { physical: 0.8 },
    weak: { energy: 1.3 },
  },
  tank: {
    type: 'tank',
    name: '装甲重卡',
    hp: 550,
    speed: 40,
    reward: 45,
    damage: 5,
    color: '#a29bfe',
    size: 24,
    resistances: { physical: 0.6, energy: 0.7 },
    weak: { poison: 1.5 },
  },
  swarm: {
    type: 'swarm',
    name: '快递小车',
    hp: 35,
    speed: 140,
    reward: 5,
    damage: 1,
    color: '#fd79a8',
    size: 11,
    resistances: {},
    weak: { ice: 1.6 },
  },
  boss: {
    type: 'boss',
    name: '车队首领',
    hp: 2500,
    speed: 50,
    reward: 200,
    damage: 10,
    color: '#e17055',
    size: 32,
    resistances: { physical: 0.7, ice: 0.5, poison: 0.6, energy: 0.8 },
    weak: {},
  },
};

export function getEnemyConfig(type: string): EnemyDefinition {
  return ENEMY_CONFIGS[type];
}
