import { LevelConfig, LEVEL_CONFIGS, ComponentType } from './config';
import { CircuitGraph } from './circuit';
import { CircuitComponent } from './components';
import type { Simulator } from './simulator';
import type { TutorialManager } from './tutorial';

export class LevelManager {
  private currentLevel: LevelConfig | null = null;
  private currentLevelIndex: number = -1;
  private completedLevels: Set<string> = new Set();
  private onLevelChange: ((level: LevelConfig) => void) | null = null;
  private onLevelComplete: ((level: LevelConfig, stats: any) => void) | null = null;
  private freePlayStartTime: number = 0;

  loadLevel(levelId: string): LevelConfig | null {
    const index = LEVEL_CONFIGS.findIndex(l => l.id === levelId);
    if (index === -1) return null;
    this.currentLevelIndex = index;
    this.currentLevel = LEVEL_CONFIGS[index];
    this.freePlayStartTime = 0;
    if (this.onLevelChange && this.currentLevel) {
      this.onLevelChange(this.currentLevel);
    }
    return this.currentLevel;
  }

  loadLevelByIndex(index: number): LevelConfig | null {
    if (index < 0 || index >= LEVEL_CONFIGS.length) return null;
    this.currentLevelIndex = index;
    this.currentLevel = LEVEL_CONFIGS[index];
    this.freePlayStartTime = 0;
    if (this.onLevelChange && this.currentLevel) {
      this.onLevelChange(this.currentLevel);
    }
    return this.currentLevel;
  }

  getCurrentLevel(): LevelConfig | null {
    return this.currentLevel;
  }

  getCurrentLevelIndex(): number {
    return this.currentLevelIndex;
  }

  getAvailableLevels(): LevelConfig[] {
    return LEVEL_CONFIGS.filter(level =>
      level.prereqs.every(prereq => this.completedLevels.has(prereq))
    );
  }

  checkSuccess(graph: CircuitGraph, simulator: Simulator): boolean {
    if (!this.currentLevel) return false;

    const criteria = this.currentLevel.successCriteria;
    const components = Array.from(graph.components.values());

    switch (criteria) {
      case 'bulb_lit': {
        return components.some(
          c => c.type === ComponentType.Bulb && (c.state?.brightness ?? 0) > 0.1
        );
      }

      case 'switch_toggle': {
        const hasSwitch = components.some(c => c.type === ComponentType.Switch);
        const hasBulbLit = components.some(
          c => c.type === ComponentType.Bulb && (c.state?.brightness ?? 0) > 0.1
        );
        return hasSwitch && hasBulbLit;
      }

      case 'resistor_effect_observed': {
        const hasResistor = components.some(c => c.type === ComponentType.Resistor);
        const hasLitBulb = components.some(
          c => c.type === ComponentType.Bulb && (c.state?.brightness ?? 0) > 0
        );
        return hasResistor && hasLitBulb;
      }

      case 'voltage_drops_measured': {
        const nodes = graph.getNodes();
        return nodes.some(node => node.pins.length > 2);
      }

      case 'current_split_observed': {
        const litBulbs = components.filter(
          c => c.type === ComponentType.Bulb && (c.state?.brightness ?? 0) > 0
        );
        return litBulbs.length >= 2;
      }

      case 'capacitor_charge_discharge_observed': {
        return components.some(
          c => c.type === ComponentType.Capacitor && (c.state?.charge ?? 0) > 0.1
        );
      }

      case 'mixed_circuit_analyzed': {
        const types = new Set(components.map(c => c.type));
        return types.size >= 4;
      }

      case 'free_play': {
        return this.checkFreePlayTime(0);
      }

      default:
        return false;
    }
  }

  completeLevel(): void {
    if (!this.currentLevel) return;
    this.completedLevels.add(this.currentLevel.id);
    if (this.onLevelComplete) {
      this.onLevelComplete(this.currentLevel, {});
    }
  }

  nextLevel(): LevelConfig | null {
    if (this.currentLevelIndex < 0) return null;
    const nextIndex = this.currentLevelIndex + 1;
    if (nextIndex >= LEVEL_CONFIGS.length) return null;
    return this.loadLevelByIndex(nextIndex);
  }

  resetLevel(): void {
    if (this.currentLevel) {
      this.loadLevelByIndex(this.currentLevelIndex);
    }
  }

  isLevelCompleted(levelId: string): boolean {
    return this.completedLevels.has(levelId);
  }

  setOnLevelChange(cb: (level: LevelConfig) => void): void {
    this.onLevelChange = cb;
  }

  setOnLevelComplete(cb: (level: LevelConfig, stats: any) => void): void {
    this.onLevelComplete = cb;
  }

  serialize(): object {
    return {
      completedLevels: Array.from(this.completedLevels),
      currentLevelIndex: this.currentLevelIndex,
    };
  }

  deserialize(data: any): void {
    if (data.completedLevels) {
      this.completedLevels = new Set(data.completedLevels);
    }
    if (typeof data.currentLevelIndex === 'number' && data.currentLevelIndex >= 0) {
      this.loadLevelByIndex(data.currentLevelIndex);
    }
  }

  startFreePlayTimer(): void {
    this.freePlayStartTime = Date.now();
  }

  checkFreePlayTime(elapsed: number): boolean {
    if (this.freePlayStartTime === 0) {
      this.startFreePlayTimer();
    }
    const duration = Date.now() - this.freePlayStartTime;
    return duration >= 30000;
  }
}
