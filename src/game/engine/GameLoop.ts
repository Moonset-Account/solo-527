export type TickCallback = (deltaTime: number) => void

export class GameLoop {
  private animationFrameId: number | null = null
  private lastTimestamp: number = 0
  private running: boolean = false
  private paused: boolean = false
  private tickCallback: TickCallback | null = null

  constructor(callback?: TickCallback) {
    this.tickCallback = callback ?? null
  }

  setTickCallback(callback: TickCallback): void {
    this.tickCallback = callback
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.paused = false
    this.lastTimestamp = performance.now()
    this.loop(this.lastTimestamp)
  }

  stop(): void {
    this.running = false
    this.paused = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  pause(): void {
    if (!this.running || this.paused) return
    this.paused = true
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  resume(): void {
    if (!this.running || !this.paused) return
    this.paused = false
    this.lastTimestamp = performance.now()
    this.loop(this.lastTimestamp)
  }

  isRunning(): boolean {
    return this.running
  }

  isPaused(): boolean {
    return this.paused
  }

  private loop = (timestamp: number): void => {
    if (!this.running || this.paused) return

    const deltaTime = (timestamp - this.lastTimestamp) / 1000
    this.lastTimestamp = timestamp

    if (this.tickCallback && deltaTime > 0 && deltaTime < 1) {
      this.tickCallback(deltaTime)
    }

    this.animationFrameId = requestAnimationFrame(this.loop)
  }
}
