import { Experiment, ExperimentStep, PlayTracker, KeyChoice, ReactionEffect } from '@/types/game';
import { stepValidator, ValidationResult } from './validator';
import { simulateReaction, ReactionResult } from './reactions';
import { eventEmitter } from '@/engine/events/emitter';

export class ExperimentEngine {
  private experiment: Experiment | null = null;
  private currentStepIndex: number = 0;
  private tracker: PlayTracker | null = null;
  private activeReagents: string[] = [];
  private temperature: number = 0;
  private effects: ReactionEffect[] = [];
  private hintsUsed: number = 0;
  private maxHints: number = 3;
  private paused: boolean = false;

  startExperiment(experiment: Experiment, levelId: string, maxHints: number): void {
    this.experiment = experiment;
    this.currentStepIndex = 0;
    this.activeReagents = [];
    this.temperature = 0;
    this.effects = [];
    this.hintsUsed = 0;
    this.maxHints = maxHints;
    this.paused = false;
    this.tracker = {
      levelId,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      failureCount: 0,
      keyChoices: [],
      score: 100,
      hintsUsed: 0,
    };
    eventEmitter.emit('experiment:start', { experimentId: experiment.id });
    eventEmitter.emit('step:current', this.getCurrentStep());
  }

  performAction(action: string, target: string, value?: number): ValidationResult {
    if (!this.experiment || this.paused) {
      return { correct: false, stepId: '', message: '实验未开始或已暂停' };
    }
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return { correct: false, stepId: '', message: '没有待执行的步骤' };
    }
    const result = stepValidator.validate(currentStep, action, target, value);
    if (result.correct) {
      const choice: KeyChoice = {
        stepId: currentStep.id,
        timestamp: Date.now(),
        choice: `${action}:${target}${value !== undefined ? '=' + value : ''}`,
        correct: true,
      };
      this.tracker?.keyChoices.push(choice);
      if (action === 'add_reagent' || action === 'drop') {
        const reagentId = target.includes(':') ? target.split(':')[0] : target;
        this.activeReagents.push(reagentId);
        if (this.activeReagents.length >= 1) {
          const reactionResult = simulateReaction(this.activeReagents, this.temperature);
          if (reactionResult.effects.length > 0) {
            this.effects = reactionResult.effects;
            eventEmitter.emit('reaction:effects', this.effects);
          }
        }
      }
      if (action === 'measure') {
        const reagentId = target.includes(':') ? target.split(':')[0] : target;
        this.activeReagents.push(reagentId);
      }
      if (action === 'control_temperature') {
        this.temperature = value || 0;
        if (this.temperature > 40) {
          const reactionResult = simulateReaction(this.activeReagents, this.temperature);
          if (reactionResult.effects.length > 0) {
            this.effects = reactionResult.effects;
            eventEmitter.emit('reaction:effects', this.effects);
          }
        }
      }
      this.currentStepIndex++;
      if (this.currentStepIndex >= this.experiment.steps.length) {
        this.completeExperiment(true);
      } else {
        eventEmitter.emit('step:current', this.getCurrentStep());
      }
    } else {
      this.tracker!.failureCount++;
      this.tracker!.score = Math.max(0, this.tracker!.score - 10);
      const choice: KeyChoice = {
        stepId: currentStep.id,
        timestamp: Date.now(),
        choice: `${action}:${target}${value !== undefined ? '=' + value : ''}`,
        correct: false,
      };
      this.tracker?.keyChoices.push(choice);
    }
    return result;
  }

  useHint(): string | null {
    if (this.hintsUsed >= this.maxHints) return null;
    const step = this.getCurrentStep();
    if (!step) return null;
    this.hintsUsed++;
    if (this.tracker) {
      this.tracker.hintsUsed = this.hintsUsed;
      this.tracker.score = Math.max(0, this.tracker.score - 5);
    }
    eventEmitter.emit('hint:used', { stepId: step.id, hint: step.hint });
    return step.hint;
  }

  private completeExperiment(success: boolean): void {
    if (!this.tracker) return;
    this.tracker.endTime = Date.now();
    this.tracker.duration = this.tracker.endTime - this.tracker.startTime;
    if (!success) {
      this.tracker.score = 0;
    }
    eventEmitter.emit('experiment:complete', { success, tracker: this.tracker });
  }

  failExperiment(): void {
    this.completeExperiment(false);
  }

  getCurrentStep(): ExperimentStep | null {
    if (!this.experiment || this.currentStepIndex >= this.experiment.steps.length) return null;
    return this.experiment.steps[this.currentStepIndex];
  }

  getProgress(): number {
    if (!this.experiment) return 0;
    return this.currentStepIndex / this.experiment.steps.length;
  }

  getTracker(): PlayTracker | null { return this.tracker; }
  getTemperature(): number { return this.temperature; }
  getEffects(): ReactionEffect[] { return this.effects; }
  isActive(): boolean { return !!this.experiment && !this.paused; }

  pause(): void { this.paused = true; eventEmitter.emit('experiment:paused'); }
  resume(): void { this.paused = false; eventEmitter.emit('experiment:resumed'); }
  reset(): void { this.experiment = null; this.currentStepIndex = 0; this.tracker = null; this.effects = []; }
}

export const experimentEngine = new ExperimentEngine();
