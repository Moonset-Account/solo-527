const ROLLING_WINDOW = 60;

class PerfStats {
  visible = true;

  private fpsSamples: number[] = [];
  private frameTimeSamples: number[] = [];
  private updateTimeSamples: number[] = [];
  private renderTimeSamples: number[] = [];
  private simTimeSamples: number[] = [];

  private frameStartTime = 0;
  private updateTimeStart = 0;
  private renderTimeStart = 0;
  private simTimeStart = 0;

  private componentCount = 0;
  private wireCount = 0;

  beginFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame() {
    const now = performance.now();
    const frameTime = now - this.frameStartTime;
    this.pushSample(this.frameTimeSamples, frameTime);

    const fps = frameTime > 0 ? 1000 / frameTime : 0;
    this.pushSample(this.fpsSamples, fps);
  }

  beginUpdate() {
    this.updateTimeStart = performance.now();
  }

  endUpdate() {
    const elapsed = performance.now() - this.updateTimeStart;
    this.pushSample(this.updateTimeSamples, elapsed);
  }

  beginRender() {
    this.renderTimeStart = performance.now();
  }

  endRender() {
    const elapsed = performance.now() - this.renderTimeStart;
    this.pushSample(this.renderTimeSamples, elapsed);
  }

  beginSim() {
    this.simTimeStart = performance.now();
  }

  endSim() {
    const elapsed = performance.now() - this.simTimeStart;
    this.pushSample(this.simTimeSamples, elapsed);
  }

  setComponentCount(count: number) {
    this.componentCount = count;
  }

  setWireCount(count: number) {
    this.wireCount = count;
  }

  getReport(): string {
    const avgFps = this.average(this.fpsSamples);
    const avgFrameTime = this.average(this.frameTimeSamples);
    const avgUpdateTime = this.average(this.updateTimeSamples);
    const avgRenderTime = this.average(this.renderTimeSamples);
    const avgSimTime = this.average(this.simTimeSamples);

    const lines: string[] = [];
    lines.push(`FPS: ${avgFps.toFixed(1)}`);
    lines.push(`Frame: ${avgFrameTime.toFixed(2)}ms`);
    lines.push(`Update: ${avgUpdateTime.toFixed(2)}ms`);
    lines.push(`Render: ${avgRenderTime.toFixed(2)}ms`);
    lines.push(`Sim: ${avgSimTime.toFixed(2)}ms`);
    lines.push(`Components: ${this.componentCount}`);
    lines.push(`Wires: ${this.wireCount}`);
    return lines.join('\n');
  }

  reset() {
    this.fpsSamples = [];
    this.frameTimeSamples = [];
    this.updateTimeSamples = [];
    this.renderTimeSamples = [];
    this.simTimeSamples = [];
    this.componentCount = 0;
    this.wireCount = 0;
  }

  private pushSample(arr: number[], value: number) {
    arr.push(value);
    if (arr.length > ROLLING_WINDOW) {
      arr.shift();
    }
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  }
}

export const perfStats = new PerfStats();
export { PerfStats };
