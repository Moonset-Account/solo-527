import type { PerfReport } from '@/types'

const BUCKET_COUNT = 10
const BUCKET_SIZE = 4

export class PerfStats {
  private fps = 0
  private minFps = Infinity
  private maxFps = 0
  private fpsHistory: number[] = []
  private frameTimeDistribution: number[] = new Array(BUCKET_COUNT).fill(0)
  private batchCount = 0
  private lastFrameTime = 0
  visible = false

  update(frameTime: number): void {
    this.lastFrameTime = frameTime
    const currentFps = frameTime > 0 ? 1000 / frameTime : 0
    this.fps = Math.round(currentFps)

    if (currentFps > 0) {
      this.minFps = Math.min(this.minFps, Math.round(currentFps))
      this.maxFps = Math.max(this.maxFps, Math.round(currentFps))
    }

    this.fpsHistory.push(currentFps)
    if (this.fpsHistory.length > 120) this.fpsHistory.shift()

    const bucket = Math.min(Math.floor(frameTime / BUCKET_SIZE), BUCKET_COUNT - 1)
    this.frameTimeDistribution[bucket]++
  }

  setBatchCount(count: number): void {
    this.batchCount = count
  }

  reset(): void {
    this.fps = 0
    this.minFps = Infinity
    this.maxFps = 0
    this.fpsHistory = []
    this.frameTimeDistribution = new Array(BUCKET_COUNT).fill(0)
    this.batchCount = 0
    this.lastFrameTime = 0
  }

  getReport(): PerfReport {
    const avgFps = this.fpsHistory.length > 0
      ? Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length)
      : 0
    return {
      fps: this.fps,
      minFps: this.minFps === Infinity ? 0 : this.minFps,
      maxFps: this.maxFps,
      avgFps,
      frameTime: Math.round(this.lastFrameTime * 100) / 100,
      batchCount: this.batchCount,
    }
  }

  formatReport(): string {
    const r = this.getReport()
    const lines: string[] = [
      `FPS: ${r.fps} (min:${r.minFps} avg:${r.avgFps} max:${r.maxFps})`,
      `Frame: ${r.frameTime}ms  Batch: ${r.batchCount}`,
    ]
    const distLine = this.frameTimeDistribution
      .map((v, i) => `${i * BUCKET_SIZE}-${(i + 1) * BUCKET_SIZE}ms:${v}`)
      .filter((_v, i) => this.frameTimeDistribution[i] > 0)
      .join(' ')
    if (distLine) lines.push(distLine)
    return lines.join('\n')
  }
}
