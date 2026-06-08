import { TutorialStep } from './config';

export class TutorialManager {
  private steps: TutorialStep[] = [];
  private currentStep: number = 0;
  private active: boolean = false;
  private completed: boolean = false;
  private skipped: boolean = false;
  private onStepChange: ((step: number, total: number, stepData: TutorialStep) => void) | null = null;
  private onHighlight: ((selector: string) => void) | null = null;
  private onTooltip: ((text: string, x: number, y: number) => void) | null = null;

  start(steps: TutorialStep[]): void {
    this.steps = steps;
    this.currentStep = 0;
    this.active = true;
    this.completed = false;
    this.skipped = false;
    if (this.onStepChange && this.steps.length > 0) {
      this.onStepChange(this.currentStep, this.steps.length, this.steps[this.currentStep]);
    }
  }

  skip(): void {
    this.skipped = true;
    this.active = false;
  }

  advance(): void {
    if (!this.active) return;
    if (this.currentStep >= this.steps.length - 1) {
      this.completed = true;
      this.active = false;
      return;
    }
    this.currentStep++;
    if (this.onStepChange) {
      this.onStepChange(this.currentStep, this.steps.length, this.steps[this.currentStep]);
    }
  }

  checkCondition(condition: string): void {
    if (!this.active) return;
    const step = this.steps[this.currentStep];
    if (!step) return;
    const waitCond = step.waitCondition;
    if (waitCond.includes(':')) {
      const [prefix, value] = waitCond.split(':');
      const [condPrefix, condValue] = condition.split(':');
      if (prefix === condPrefix && (value === condValue || condValue !== undefined)) {
        this.advance();
      }
    } else {
      if (waitCond === condition) {
        this.advance();
      }
    }
  }

  isActive(): boolean {
    return this.active;
  }

  isCompleted(): boolean {
    return this.completed;
  }

  isSkipped(): boolean {
    return this.skipped;
  }

  getCurrentStep(): TutorialStep | null {
    if (!this.active || this.currentStep >= this.steps.length) return null;
    return this.steps[this.currentStep];
  }

  getCurrentStepIndex(): number {
    return this.currentStep;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  setOnStepChange(cb: (step: number, total: number, stepData: TutorialStep) => void): void {
    this.onStepChange = cb;
  }

  setOnHighlight(cb: (selector: string) => void): void {
    this.onHighlight = cb;
  }

  setOnTooltip(cb: (text: string, x: number, y: number) => void): void {
    this.onTooltip = cb;
  }

  update(): void {
    if (!this.active) return;
    const step = this.steps[this.currentStep];
    if (!step) return;
    if (this.onHighlight && step.highlight) {
      this.onHighlight(step.highlight);
    }
    if (this.onTooltip && step.text) {
      this.onTooltip(step.text, 0, 0);
    }
  }

  reset(): void {
    this.steps = [];
    this.currentStep = 0;
    this.active = false;
    this.completed = false;
    this.skipped = false;
    this.onStepChange = null;
    this.onHighlight = null;
    this.onTooltip = null;
  }
}
