import type { LevelConfig } from '@/types';

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'level-1',
    name: '初探茶园',
    description: '新手教程关卡，熟悉基础操作。保护采摘车通过平缓山路。',
    difficulty: 1,
    startGold: 400,
    startLives: 20,
    theme: 'tea-hills',
    path: [
      { position: { x: -60, y: 250 }, width: 50 },
      { position: { x: 200, y: 250 }, width: 50 },
      { position: { x: 350, y: 400 }, width: 50 },
      { position: { x: 600, y: 400 }, width: 50 },
      { position: { x: 750, y: 250 }, width: 50 },
      { position: { x: 1000, y: 250 }, width: 50 },
      { position: { x: 1150, y: 500 }, width: 50 },
      { position: { x: 1450, y: 500 }, width: 50 },
      { position: { x: 1660, y: 500 }, width: 50 },
    ],
    buildableAreas: [
      { x: 0, y: 80, width: 1600, height: 130 },
      { x: 0, y: 470, width: 1600, height: 450 },
      { x: 280, y: 320, width: 220, height: 60 },
      { x: 780, y: 180, width: 220, height: 60 },
      { x: 1060, y: 380, width: 280, height: 90 },
    ],
    weather: ['sunny', 'sunny', 'rain', 'sunny', 'sunny'],
    waves: [
      {
        id: 1,
        spawns: [{ enemyType: 'scout', count: 6, interval: 1.2 }],
        reward: 50,
      },
      {
        id: 2,
        spawns: [
          { enemyType: 'scout', count: 8, interval: 1.0 },
          { enemyType: 'swarm', count: 4, interval: 0.6, delay: 4 },
        ],
        reward: 70,
      },
      {
        id: 3,
        spawns: [
          { enemyType: 'truck', count: 4, interval: 1.8 },
          { enemyType: 'scout', count: 6, interval: 1.0, delay: 5 },
        ],
        reward: 90,
      },
      {
        id: 4,
        spawns: [
          { enemyType: 'swarm', count: 12, interval: 0.5 },
          { enemyType: 'truck', count: 3, interval: 2.0, delay: 8 },
        ],
        reward: 110,
      },
      {
        id: 5,
        spawns: [
          { enemyType: 'tank', count: 1, interval: 1 },
          { enemyType: 'truck', count: 6, interval: 1.5, delay: 3 },
          { enemyType: 'swarm', count: 8, interval: 0.5, delay: 10 },
        ],
        reward: 200,
      },
    ],
  },
  {
    id: 'level-2',
    name: '蜿蜒山道',
    description: '更复杂的山路带来更多战术选择。善用拐角位置布置塔。',
    difficulty: 2,
    startGold: 450,
    startLives: 18,
    theme: 'mountain',
    path: [
      { position: { x: -60, y: 150 }, width: 50 },
      { position: { x: 180, y: 150 }, width: 50 },
      { position: { x: 180, y: 500 }, width: 50 },
      { position: { x: 500, y: 500 }, width: 50 },
      { position: { x: 500, y: 200 }, width: 50 },
      { position: { x: 800, y: 200 }, width: 50 },
      { position: { x: 800, y: 700 }, width: 50 },
      { position: { x: 1200, y: 700 }, width: 50 },
      { position: { x: 1200, y: 350 }, width: 50 },
      { position: { x: 1660, y: 350 }, width: 50 },
    ],
    buildableAreas: [
      { x: 0, y: 0, width: 120, height: 900 },
      { x: 230, y: 0, width: 240, height: 120 },
      { x: 230, y: 200, width: 240, height: 270 },
      { x: 230, y: 560, width: 240, height: 340 },
      { x: 550, y: 0, width: 220, height: 130 },
      { x: 550, y: 260, width: 220, height: 220 },
      { x: 550, y: 560, width: 220, height: 340 },
      { x: 860, y: 0, width: 300, height: 130 },
      { x: 860, y: 260, width: 300, height: 410 },
      { x: 860, y: 760, width: 300, height: 140 },
      { x: 1260, y: 0, width: 340, height: 280 },
      { x: 1260, y: 420, width: 340, height: 480 },
    ],
    weather: ['sunny', 'rain', 'rain', 'fog', 'snow', 'sunny'],
    waves: [
      {
        id: 1,
        spawns: [
          { enemyType: 'scout', count: 8, interval: 1.0 },
          { enemyType: 'swarm', count: 5, interval: 0.5, delay: 5 },
        ],
        reward: 60,
      },
      {
        id: 2,
        spawns: [
          { enemyType: 'truck', count: 5, interval: 1.5 },
          { enemyType: 'scout', count: 8, interval: 0.8, delay: 4 },
        ],
        reward: 85,
      },
      {
        id: 3,
        spawns: [
          { enemyType: 'swarm', count: 15, interval: 0.4 },
          { enemyType: 'truck', count: 4, interval: 1.5, delay: 6 },
        ],
        reward: 110,
      },
      {
        id: 4,
        spawns: [
          { enemyType: 'tank', count: 1, interval: 1 },
          { enemyType: 'scout', count: 12, interval: 0.7, delay: 3 },
          { enemyType: 'truck', count: 3, interval: 1.8, delay: 8 },
        ],
        reward: 140,
      },
      {
        id: 5,
        spawns: [
          { enemyType: 'truck', count: 8, interval: 1.2 },
          { enemyType: 'swarm', count: 20, interval: 0.35, delay: 5 },
          { enemyType: 'tank', count: 2, interval: 3, delay: 12 },
        ],
        reward: 170,
      },
      {
        id: 6,
        spawns: [
          { enemyType: 'boss', count: 1, interval: 1 },
          { enemyType: 'tank', count: 2, interval: 4, delay: 5 },
          { enemyType: 'truck', count: 10, interval: 1.2, delay: 3 },
          { enemyType: 'swarm', count: 15, interval: 0.4, delay: 10 },
        ],
        reward: 300,
      },
    ],
  },
  {
    id: 'level-3',
    name: '云顶茶园',
    description: '高难度关卡：多天气变化，多兵种混合，考验你的布置策略。',
    difficulty: 3,
    startGold: 500,
    startLives: 15,
    theme: 'cloudy',
    path: [
      { position: { x: -60, y: 500 }, width: 50 },
      { position: { x: 250, y: 500 }, width: 50 },
      { position: { x: 250, y: 150 }, width: 50 },
      { position: { x: 550, y: 150 }, width: 50 },
      { position: { x: 550, y: 750 }, width: 50 },
      { position: { x: 850, y: 750 }, width: 50 },
      { position: { x: 850, y: 300 }, width: 50 },
      { position: { x: 1150, y: 300 }, width: 50 },
      { position: { x: 1150, y: 600 }, width: 50 },
      { position: { x: 1400, y: 600 }, width: 50 },
      { position: { x: 1400, y: 200 }, width: 50 },
      { position: { x: 1660, y: 200 }, width: 50 },
    ],
    buildableAreas: [
      { x: 0, y: 0, width: 1600, height: 80 },
      { x: 0, y: 820, width: 1600, height: 180 },
      { x: 60, y: 200, width: 160, height: 270 },
      { x: 60, y: 560, width: 160, height: 240 },
      { x: 300, y: 200, width: 220, height: 520 },
      { x: 600, y: 80, width: 220, height: 640 },
      { x: 900, y: 80, width: 220, height: 190 },
      { x: 900, y: 360, width: 220, height: 210 },
      { x: 900, y: 660, width: 220, height: 140 },
      { x: 1200, y: 80, width: 170, height: 490 },
      { x: 1200, y: 660, width: 170, height: 140 },
      { x: 1450, y: 80, width: 150, height: 900 },
    ],
    weather: ['sunny', 'rain', 'fog', 'snow', 'typhoon', 'sunny', 'fog'],
    waves: [
      {
        id: 1,
        spawns: [
          { enemyType: 'scout', count: 10, interval: 0.9 },
          { enemyType: 'swarm', count: 8, interval: 0.45, delay: 4 },
        ],
        reward: 70,
      },
      {
        id: 2,
        spawns: [
          { enemyType: 'truck', count: 6, interval: 1.3 },
          { enemyType: 'scout', count: 10, interval: 0.7, delay: 3 },
          { enemyType: 'swarm', count: 8, interval: 0.45, delay: 8 },
        ],
        reward: 100,
      },
      {
        id: 3,
        spawns: [
          { enemyType: 'tank', count: 2, interval: 3 },
          { enemyType: 'truck', count: 6, interval: 1.2, delay: 2 },
          { enemyType: 'scout', count: 10, interval: 0.6, delay: 6 },
        ],
        reward: 140,
      },
      {
        id: 4,
        spawns: [
          { enemyType: 'swarm', count: 25, interval: 0.3 },
          { enemyType: 'tank', count: 2, interval: 2.5, delay: 5 },
          { enemyType: 'truck', count: 8, interval: 1.1, delay: 3 },
        ],
        reward: 170,
      },
      {
        id: 5,
        spawns: [
          { enemyType: 'tank', count: 3, interval: 2 },
          { enemyType: 'truck', count: 12, interval: 1.0 },
          { enemyType: 'swarm', count: 20, interval: 0.3, delay: 6 },
        ],
        reward: 210,
      },
      {
        id: 6,
        spawns: [
          { enemyType: 'boss', count: 1, interval: 1 },
          { enemyType: 'tank', count: 3, interval: 3, delay: 4 },
          { enemyType: 'truck', count: 15, interval: 1.0, delay: 2 },
          { enemyType: 'swarm', count: 25, interval: 0.3, delay: 8 },
        ],
        reward: 280,
      },
      {
        id: 7,
        spawns: [
          { enemyType: 'boss', count: 2, interval: 12 },
          { enemyType: 'tank', count: 5, interval: 2.5, delay: 5 },
          { enemyType: 'truck', count: 18, interval: 0.9 },
          { enemyType: 'scout', count: 25, interval: 0.5, delay: 10 },
          { enemyType: 'swarm', count: 30, interval: 0.25, delay: 3 },
        ],
        reward: 500,
      },
    ],
  },
];

export function getLevelConfig(id: string): LevelConfig | undefined {
  return LEVEL_CONFIGS.find((l) => l.id === id);
}
