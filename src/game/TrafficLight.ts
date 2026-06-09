import type { LightPhase, PhaseConfig, TrafficLightState } from '@/types';

const PHASE_ORDER: LightPhase[] = [
  'NS_GREEN',
  'NS_YELLOW',
  'ALL_RED',
  'EW_GREEN',
  'EW_YELLOW',
  'ALL_RED',
];

export class TrafficLightController {
  private state: TrafficLightState;
  private config: PhaseConfig;
  private phaseIndex: number = 0;
  private busOverrideActive: boolean = false;
  private busOverrideTimer: number = 0;
  private readonly BUS_OVERRIDE_DURATION: number = 6;

  constructor(config: PhaseConfig) {
    this.config = { ...config };
    this.state = {
      currentPhase: 'NS_GREEN',
      phaseTimer: 0,
      totalCycle: this.calculateTotalCycle(config),
      busOverride: false,
      nsIntensity: 1,
      ewIntensity: 0,
    };
  }

  private calculateTotalCycle(config: PhaseConfig): number {
    return (
      config.nsGreen +
      config.ewGreen +
      config.yellow * 2 +
      config.allRed * 2
    );
  }

  private getPhaseDuration(phase: LightPhase): number {
    switch (phase) {
      case 'NS_GREEN':
        return this.config.nsGreen;
      case 'EW_GREEN':
        return this.config.ewGreen;
      case 'NS_YELLOW':
      case 'EW_YELLOW':
        return this.config.yellow;
      case 'ALL_RED':
        return this.config.allRed;
    }
  }

  private calculateIntensities(
    phase: LightPhase,
    progress: number
  ): { ns: number; ew: number } {
    const transition = 0.3;
    switch (phase) {
      case 'NS_GREEN':
        return {
          ns: progress < transition ? progress / transition : 1,
          ew: 0,
        };
      case 'NS_YELLOW':
        return {
          ns: 1,
          ew: 0,
        };
      case 'EW_GREEN':
        return {
          ns: 0,
          ew: progress < transition ? progress / transition : 1,
        };
      case 'EW_YELLOW':
        return {
          ns: 0,
          ew: 1,
        };
      case 'ALL_RED':
        return { ns: 0, ew: 0 };
    }
  }

  update(delta: number): void {
    if (this.busOverrideActive) {
      this.busOverrideTimer -= delta;
      if (this.busOverrideTimer <= 0) {
        this.busOverrideActive = false;
        this.state.busOverride = false;
      }
    }

    this.state.phaseTimer += delta;
    const currentDuration = this.getPhaseDuration(this.state.currentPhase);
    const phaseProgress = this.state.phaseTimer / currentDuration;

    const intensities = this.calculateIntensities(
      this.state.currentPhase,
      Math.min(1, phaseProgress)
    );
    this.state.nsIntensity = intensities.ns;
    this.state.ewIntensity = intensities.ew;

    if (this.state.phaseTimer >= currentDuration) {
      this.state.phaseTimer = 0;
      this.advancePhase();
    }
  }

  private advancePhase(): void {
    this.phaseIndex = (this.phaseIndex + 1) % PHASE_ORDER.length;
    this.state.currentPhase = PHASE_ORDER[this.phaseIndex];
  }

  triggerBusPriority(): void {
    if (!this.config.busPriority || this.busOverrideActive) return;

    this.busOverrideActive = true;
    this.busOverrideTimer = this.BUS_OVERRIDE_DURATION;
    this.state.busOverride = true;

    if (this.state.currentPhase === 'EW_GREEN') {
      this.state.currentPhase = 'EW_YELLOW';
      this.state.phaseTimer = 0;
      this.phaseIndex = PHASE_ORDER.indexOf('EW_YELLOW');
    }
  }

  getState(): TrafficLightState {
    return { ...this.state };
  }

  isGreen(direction: 'NS' | 'EW'): boolean {
    if (direction === 'NS') {
      return this.state.currentPhase === 'NS_GREEN';
    }
    return this.state.currentPhase === 'EW_GREEN';
  }

  isYellow(direction: 'NS' | 'EW'): boolean {
    if (direction === 'NS') {
      return this.state.currentPhase === 'NS_YELLOW';
    }
    return this.state.currentPhase === 'EW_YELLOW';
  }

  isRed(direction: 'NS' | 'EW'): boolean {
    return !this.isGreen(direction) && !this.isYellow(direction);
  }

  applyConfig(config: Partial<PhaseConfig>): void {
    this.config = { ...this.config, ...config };
    this.state.totalCycle = this.calculateTotalCycle(this.config);
  }

  getConfig(): PhaseConfig {
    return { ...this.config };
  }

  getPhaseProgress(): number {
    const duration = this.getPhaseDuration(this.state.currentPhase);
    return duration > 0 ? Math.min(1, this.state.phaseTimer / duration) : 0;
  }

  getTimeUntilNextPhase(): number {
    const duration = this.getPhaseDuration(this.state.currentPhase);
    return Math.max(0, duration - this.state.phaseTimer);
  }

  reset(): void {
    this.phaseIndex = 0;
    this.state = {
      currentPhase: 'NS_GREEN',
      phaseTimer: 0,
      totalCycle: this.calculateTotalCycle(this.config),
      busOverride: false,
      nsIntensity: 1,
      ewIntensity: 0,
    };
    this.busOverrideActive = false;
    this.busOverrideTimer = 0;
  }
}
