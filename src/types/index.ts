export type Vec2 = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface IDisposable {
  dispose(): void;
}

export interface IUpdateable {
  update(dt: number): void;
}

export interface IRenderable {
  render(ctx: CanvasRenderingContext2D): void;
}

export interface IGameEntity extends IUpdateable, IRenderable, IDisposable {
  id: string;
  alive: boolean;
  position: Vec2;
}

export type TowerType = 'sniper' | 'cannon' | 'frost' | 'poison' | 'tesla' | 'barrier';

export type EnemyType = 'scout' | 'truck' | 'tank' | 'swarm' | 'boss';

export type WeatherType = 'sunny' | 'rain' | 'fog' | 'snow' | 'typhoon';

export type GameState = 'menu' | 'playing' | 'paused' | 'victory' | 'defeat';

export type GamePhase = 'preparation' | 'wave' | 'break';

export type DamageType = 'physical' | 'energy' | 'poison' | 'ice' | 'fire';

export interface EffectType {
  id: string;
  type: 'slow' | 'poison' | 'stun' | 'burn';
  duration: number;
  multiplier?: number;
  value?: number;
}

export interface WaveEnemySpawn {
  enemyType: EnemyType;
  count: number;
  interval: number;
  delay?: number;
  hpMultiplier?: number;
}

export interface WaveConfig {
  id: number;
  spawns: WaveEnemySpawn[];
  reward: number;
  duration?: number;
}

export interface PathNode {
  position: Vec2;
  width?: number;
}

export interface TowerStats {
  damage: number;
  range: number;
  fireRate: number;
  cost: number;
  projectileSpeed?: number;
  splashRadius?: number;
}

export interface TowerLevelData {
  level: number;
  stats: TowerStats;
  upgradeCost: number;
}

export interface TowerDefinition {
  type: TowerType;
  name: string;
  description: string;
  icon: string;
  color: string;
  damageType: DamageType;
  levels: TowerLevelData[];
  targeting?: string[];
  effects?: EffectType[];
}

export interface EnemyDefinition {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  damage: number;
  color: string;
  size: number;
  resistances?: Partial<Record<DamageType, number>>;
  weak?: Partial<Record<DamageType, number>>;
}

export interface WeatherDefinition {
  type: WeatherType;
  name: string;
  icon: string;
  description: string;
  color: string;
  effects: {
    enemySpeedMult?: number;
    towerFireRateMult?: number;
    towerRangeMult?: number;
    visibilityMult?: number;
    particleName?: string;
  };
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  startGold: number;
  startLives: number;
  path: PathNode[];
  buildableAreas: Rect[];
  waves: WaveConfig[];
  weather?: WeatherType[];
  theme: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition: string;
  target: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  levelId: string;
  modifiers: string[];
  reward: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  experience: number;
  gold: number;
  unlockedLevels: string[];
  unlockedTowers: TowerType[];
  achievements: Record<string, boolean>;
  completedLevels: Record<string, { stars: number; bestTime: number; bestWave: number }>;
  totalPlayTime: number;
  totalWins: number;
  totalLosses: number;
  totalKills: number;
  highestWave: number;
  challengeStreak: number;
  lastDailyDate: string;
}

export interface PlayRecord {
  levelId: string;
  date: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  result: 'win' | 'lose' | 'quit';
  waveReached: number;
  livesRemaining: number;
  goldRemaining: number;
  goldSpent: number;
  towersBuilt: Record<TowerType, number>;
  towersUpgraded: number;
  enemiesKilled: number;
  criticalChoices: string[];
  failureReason?: string;
  weather: WeatherType;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  levelId: string;
  score: number;
  time: number;
  wave: number;
  date: string;
}

export type EventHandler<T = unknown> = (data: T) => void;

export interface GameEvents {
  'game:stateChange': GameState;
  'game:victory': { levelId: string; stats: PlayRecord; rewards: { gold: number; exp: number; stars: number } };
  'game:defeat': { levelId: string; stats: PlayRecord; reason: string; suggestions: string[] };
  'wave:start': WaveConfig;
  'wave:complete': WaveConfig;
  'tower:place': { tower: TowerType; position: Vec2; cost: number };
  'tower:upgrade': { towerId: string; level: number; cost: number };
  'tower:sell': { towerId: string; refund: number };
  'enemy:death': { enemyType: EnemyType; reward: number };
  'enemy:reach': { enemyType: EnemyType; damage: number };
  'resource:change': { type: 'gold' | 'lives'; old: number; new: number };
  'weather:change': { from: WeatherType; to: WeatherType };
  'achievement:unlock': AchievementDef;
  'debug:toggle': { key: string; value: boolean };
  'play:record': PlayRecord;
}
