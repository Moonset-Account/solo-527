import type {
  LevelConfig,
  Objective,
  SimulationResult,
  ComponentInstance,
  WireInstance,
  StarCondition,
} from './types';

export interface ObjectiveCheckResult {
  completed: string[];
  failed: string[];
  progress: Record<string, number>;
}

export interface StarCheckContext {
  failures: number;
  timeSpent: number;
  componentsUsed: number;
}

export class ChallengeSystem {
  private levelConfig: LevelConfig;

  constructor(levelConfig: LevelConfig) {
    this.levelConfig = levelConfig;
  }

  checkObjectives(
    simResult: SimulationResult,
    components: ComponentInstance[],
    wires: WireInstance[]
  ): ObjectiveCheckResult {
    const completed: string[] = [];
    const failed: string[] = [];
    const progress: Record<string, number> = {};

    for (const objective of this.levelConfig.objectives) {
      const result = this.checkObjective(objective, simResult, components, wires);
      progress[objective.id] = result.progress;
      if (result.passed) {
        completed.push(objective.id);
      } else {
        failed.push(objective.id);
      }
    }

    return { completed, failed, progress };
  }

  checkStarConditions(
    simResult: SimulationResult,
    components: ComponentInstance[],
    wires: WireInstance[],
    context: StarCheckContext
  ): 0 | 1 | 2 | 3 {
    let stars: 0 | 1 | 2 | 3 = 0;

    const sortedConditions = [...this.levelConfig.starConditions].sort(
      (a, b) => a.stars - b.stars
    );

    for (const starCondition of sortedConditions) {
      const result = this.checkObjective(
        starCondition.condition,
        simResult,
        components,
        wires,
        context
      );
      if (result.passed) {
        stars = starCondition.stars;
      }
    }

    return stars;
  }

  getObjectiveDescriptions(): { id: string; description: string; type: string }[] {
    return this.levelConfig.objectives.map((obj) => ({
      id: obj.id,
      description: obj.description,
      type: obj.type,
    }));
  }

  private checkObjective(
    objective: Objective,
    simResult: SimulationResult,
    components: ComponentInstance[],
    wires: WireInstance[],
    context?: StarCheckContext
  ): { passed: boolean; progress: number } {
    switch (objective.type) {
      case 'bulb_lit':
        return this.checkBulbLit(objective, simResult, components);

      case 'all_switches_used':
        return this.checkAllSwitchesUsed(simResult, components);

      case 'component_count':
        return this.checkComponentCount(objective, components, wires);

      case 'no_short_circuit':
        return this.checkNoShortCircuit(simResult);

      case 'specific_bulbs_lit':
        return this.checkSpecificBulbsLit(objective, simResult, components);

      default:
        return { passed: false, progress: 0 };
    }
  }

  private checkBulbLit(
    objective: Objective,
    simResult: SimulationResult,
    components: ComponentInstance[]
  ): { passed: boolean; progress: number } {
    const requiredCount = (objective.params.count as number) ?? 1;
    const bulbs = components.filter((c) => c.type === 'bulb');
    let litCount = 0;

    for (const bulb of bulbs) {
      const state = simResult.componentStates[bulb.id];
      if (state && state.lit) {
        litCount++;
      }
    }

    const progress = requiredCount > 0 ? Math.min(1, litCount / requiredCount) : 0;
    return { passed: litCount >= requiredCount, progress };
  }

  private checkAllSwitchesUsed(
    simResult: SimulationResult,
    components: ComponentInstance[]
  ): { passed: boolean; progress: number } {
    const switches = components.filter((c) => c.type === 'switch');
    if (switches.length === 0) {
      return { passed: true, progress: 1 };
    }

    let usedCount = 0;
    for (const sw of switches) {
      const state = simResult.componentStates[sw.id];
      if (state && state.closed && Math.abs(state.current) > 0.001) {
        usedCount++;
      }
    }

    const progress = switches.length > 0 ? usedCount / switches.length : 1;
    return { passed: usedCount === switches.length, progress };
  }

  private checkComponentCount(
    objective: Objective,
    components: ComponentInstance[],
    wires: WireInstance[]
  ): { passed: boolean; progress: number } {
    const componentType = objective.params.componentType as string;
    const max = objective.params.max as number | undefined;
    const min = objective.params.min as number | undefined;
    const exact = objective.params.exact as number | undefined;

    let count: number;
    if (componentType === 'wire') {
      count = wires.length;
    } else {
      count = components.filter((c) => c.type === componentType).length;
    }

    let passed: boolean;
    let progress: number;

    if (exact !== undefined) {
      passed = count === exact;
      progress = count === exact ? 1 : 0;
    } else if (max !== undefined && min !== undefined) {
      passed = count >= min && count <= max;
      const ideal = (min + max) / 2;
      progress = count >= min && count <= max ? 1 : 0;
    } else if (max !== undefined) {
      passed = count <= max;
      progress = max > 0 ? Math.min(1, (max - Math.max(0, count - max)) / max) : 0;
    } else if (min !== undefined) {
      passed = count >= min;
      progress = min > 0 ? Math.min(1, count / min) : 1;
    } else {
      passed = true;
      progress = 1;
    }

    return { passed, progress };
  }

  private checkNoShortCircuit(
    simResult: SimulationResult
  ): { passed: boolean; progress: number } {
    const passed = !simResult.hasShortCircuit;
    return { passed, progress: passed ? 1 : 0 };
  }

  private checkSpecificBulbsLit(
    objective: Objective,
    simResult: SimulationResult,
    components: ComponentInstance[]
  ): { passed: boolean; progress: number } {
    const bulbIds = (objective.params.bulbIds as string[]) ?? [];
    if (bulbIds.length === 0) {
      return { passed: true, progress: 1 };
    }

    let litCount = 0;
    for (const bulbId of bulbIds) {
      const state = simResult.componentStates[bulbId];
      if (state && state.lit) {
        litCount++;
      }
    }

    const progress = bulbIds.length > 0 ? litCount / bulbIds.length : 1;
    return { passed: litCount === bulbIds.length, progress };
  }
}
