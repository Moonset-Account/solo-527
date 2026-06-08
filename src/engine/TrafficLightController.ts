import type { LightPhase, Direction, TrafficLightConfig, TrafficLightState } from '@/engine/types';
import { PHASE_SEQUENCE } from '@/config/traffic';

export class TrafficLightController {
  config: TrafficLightConfig;
  phase: LightPhase = 'ns-green';
  timer = 0;

  constructor(config: TrafficLightConfig) {
    this.config = { ...config, busPriorityCooldown: 0 };
  }

  update(dt: number, approachingBusDistances: number[] = []): void {
    if (this.config.busPriorityCooldown > 0) {
      this.config.busPriorityCooldown = Math.max(0, this.config.busPriorityCooldown - dt);
    }

    this.timer += dt;

    if (this.config.busPriorityEnabled && approachingBusDistances.length > 0 && this.config.busPriorityCooldown <= 0) {
      this.handleBusPriority(approachingBusDistances);
    }

    const phaseKey = this.phase.replace('-', '') as keyof typeof PHASE_SEQUENCE;
    const phaseConfig = PHASE_SEQUENCE[phaseKey];
    const duration = phaseConfig.duration(
      this.phase.startsWith('ns') ? this.config.nsGreenDuration : this.config.ewGreenDuration
    );

    if (this.timer >= duration) {
      this.phase = phaseConfig.next as LightPhase;
      this.timer = 0;
    }
  }

  private handleBusPriority(distances: number[]): void {
    const busDetectionRange = 50;
    const closeBus = distances.some(d => d < busDetectionRange && d > 0);
    if (!closeBus) return;

    if (this.phase === 'ns-green' || this.phase === 'ew-green') {
      const remainingTime =
        (this.phase === 'ns-green' ? this.config.nsGreenDuration : this.config.ewGreenDuration) - this.timer;
      if (remainingTime > 0 && remainingTime < this.config.busPriorityExtendSeconds) {
        if (this.phase === 'ns-green') {
          this.config.nsGreenDuration += this.config.busPriorityExtendSeconds;
          this.config.nsGreenDuration = Math.min(90, this.config.nsGreenDuration);
        } else {
          this.config.ewGreenDuration += this.config.busPriorityExtendSeconds;
          this.config.ewGreenDuration = Math.min(90, this.config.ewGreenDuration);
        }
        this.config.busPriorityCooldown = 30;
      }
    } else {
      this.timer += this.config.busPriorityAdvanceSeconds;
      const currentDuration = this.getCurrentPhaseDuration();
      if (this.timer >= currentDuration) {
        this.phase = PHASE_SEQUENCE[this.phase.replace('-', '') as keyof typeof PHASE_SEQUENCE].next as LightPhase;
        this.timer = 0;
      }
      this.config.busPriorityCooldown = 30;
    }
  }

  private getCurrentPhaseDuration(): number {
    const phaseKey = this.phase.replace('-', '') as keyof typeof PHASE_SEQUENCE;
    return PHASE_SEQUENCE[phaseKey].duration(
      this.phase.startsWith('ns') ? this.config.nsGreenDuration : this.config.ewGreenDuration
    );
  }

  getLightState(direction: Direction): 'red' | 'yellow' | 'green' {
    const isNS = direction === 'north' || direction === 'south';
    if (isNS) {
      if (this.phase === 'ns-green') return 'green';
      if (this.phase === 'ns-yellow') return 'yellow';
      return 'red';
    } else {
      if (this.phase === 'ew-green') return 'green';
      if (this.phase === 'ew-yellow') return 'yellow';
      return 'red';
    }
  }

  setConfig(patch: Partial<TrafficLightConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  getState(): TrafficLightState {
    return {
      intersectionId: this.config.intersectionId,
      phase: this.phase,
      timer: this.timer,
      nsGreenDuration: this.config.nsGreenDuration,
      ewGreenDuration: this.config.ewGreenDuration,
      busPriorityEnabled: this.config.busPriorityEnabled,
      busPriorityCooldown: this.config.busPriorityCooldown,
    };
  }

  reset(): void {
    this.phase = 'ns-green';
    this.timer = 0;
    this.config.busPriorityCooldown = 0;
  }
}
