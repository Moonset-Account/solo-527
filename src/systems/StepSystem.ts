export class StepSystem {
  private maxSteps: number;
  private currentSteps: number = 0;
  private onStepCallback: ((steps: number, max: number) => void) | null = null;
  private onExceedCallback: (() => void) | null = null;

  constructor(maxSteps: number) {
    this.maxSteps = maxSteps;
  }

  step(): boolean {
    this.currentSteps++;
    if (this.onStepCallback) {
      this.onStepCallback(this.currentSteps, this.maxSteps);
    }
    if (this.currentSteps >= this.maxSteps) {
      if (this.onExceedCallback) {
        this.onExceedCallback();
      }
      return false;
    }
    return true;
  }

  getSteps(): number { return this.currentSteps; }
  getMaxSteps(): number { return this.maxSteps; }
  getRemaining(): number { return this.maxSteps - this.currentSteps; }
  isExceeded(): boolean { return this.currentSteps >= this.maxSteps; }

  onStep(callback: (steps: number, max: number) => void): void {
    this.onStepCallback = callback;
  }

  onExceed(callback: () => void): void {
    this.onExceedCallback = callback;
  }

  reset(): void {
    this.currentSteps = 0;
  }
}
