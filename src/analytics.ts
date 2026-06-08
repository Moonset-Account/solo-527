import { Settings } from './config';

export interface AnalyticsData {
  levelId: string;
  startTime: number;
  endTime: number;
  retries: number;
  hintsUsed: number;
  tutorialSkipped: boolean;
  failureSteps: { step: string; count: number }[];
  componentPlaceCount: Record<string, number>;
  wireCount: number;
  switchToggleCount: number;
}

export class AnalyticsTracker {
  private currentData: AnalyticsData = this.createDefaultData();
  private history: AnalyticsData[] = [];
  private totalRetries: number = 0;

  private createDefaultData(): AnalyticsData {
    return {
      levelId: '',
      startTime: 0,
      endTime: 0,
      retries: 0,
      hintsUsed: 0,
      tutorialSkipped: false,
      failureSteps: [],
      componentPlaceCount: {},
      wireCount: 0,
      switchToggleCount: 0,
    };
  }

  startLevel(levelId: string): void {
    this.currentData = this.createDefaultData();
    this.currentData.levelId = levelId;
    this.currentData.startTime = Date.now();
  }

  recordFailure(step: string): void {
    const existing = this.currentData.failureSteps.find(f => f.step === step);
    if (existing) {
      existing.count++;
    } else {
      this.currentData.failureSteps.push({ step, count: 1 });
    }
  }

  recordHint(): void {
    this.currentData.hintsUsed++;
  }

  recordComponentPlace(type: string): void {
    this.currentData.componentPlaceCount[type] = (this.currentData.componentPlaceCount[type] || 0) + 1;
  }

  recordWireConnect(): void {
    this.currentData.wireCount++;
  }

  recordSwitchToggle(): void {
    this.currentData.switchToggleCount++;
  }

  recordRetry(): void {
    this.currentData.retries++;
    this.totalRetries++;
  }

  recordTutorialSkipped(): void {
    this.currentData.tutorialSkipped = true;
  }

  completeLevel(): void {
    this.currentData.endTime = Date.now();
    this.history.push(this.currentData);
  }

  getCurrentData(): AnalyticsData {
    return this.currentData;
  }

  getHistory(): AnalyticsData[] {
    return this.history;
  }

  getTotalRetries(): number {
    return this.totalRetries;
  }

  getLevelAnalytics(levelId: string): AnalyticsData | undefined {
    return this.history.find(data => data.levelId === levelId);
  }

  serialize(): object {
    return {
      history: this.history,
      totalRetries: this.totalRetries,
      currentData: this.currentData,
    };
  }

  deserialize(data: any): void {
    if (data.history) {
      this.history = data.history;
    }
    if (typeof data.totalRetries === 'number') {
      this.totalRetries = data.totalRetries;
    }
    if (data.currentData) {
      this.currentData = { ...this.createDefaultData(), ...data.currentData };
    }
  }
}
