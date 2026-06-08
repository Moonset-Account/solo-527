type TimerMode = 'auto' | '30' | '60'

export class GameTimer {
  private mode: TimerMode = 'auto'
  private running = false
  private rafId = 0
  private lastTime = 0
  private callback: ((dt: number) => void) | null = null
  private currentFps = 60
  private frameTimes: number[] = []
  private slowFrameCount = 0
  private targetInterval = 0
  private accumulated = 0

  start(callback: (dt: number) => void): void {
    if (this.running) return
    this.running = true
    this.callback = callback
    this.lastTime = performance.now()
    this.frameTimes = []
    this.slowFrameCount = 0
    this.updateTargetInterval()
    this.rafId = requestAnimationFrame(this.loop.bind(this))
  }

  stop(): void {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    this.callback = null
  }

  setMode(mode: TimerMode): void {
    this.mode = mode
    this.updateTargetInterval()
  }

  getFps(): number {
    return this.currentFps
  }

  private updateTargetInterval(): void {
    const effectiveFps = this.getEffectiveFps()
    this.targetInterval = 1000 / effectiveFps
  }

  private getEffectiveFps(): number {
    if (this.mode === '30') return 30
    if (this.mode === '60') return 60
    return 60
  }

  private loop(now: number): void {
    if (!this.running) return

    const rawDt = now - this.lastTime
    this.lastTime = now
    this.accumulated += rawDt

    this.frameTimes.push(rawDt)
    if (this.frameTimes.length > 60) this.frameTimes.shift()

    this.currentFps = this.frameTimes.length > 0
      ? Math.round(1000 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length))
      : 60

    if (this.mode === 'auto') {
      const avgFrameTime = this.frameTimes.length >= 10
        ? this.frameTimes.slice(-10).reduce((a, b) => a + b, 0) / 10
        : 0
      if (avgFrameTime > 20) {
        this.slowFrameCount++
      } else {
        this.slowFrameCount = Math.max(0, this.slowFrameCount - 1)
      }
      if (this.slowFrameCount >= 10) {
        this.targetInterval = 1000 / 30
      } else if (this.slowFrameCount === 0) {
        this.targetInterval = 1000 / 60
      }
    }

    if (this.accumulated >= this.targetInterval) {
      const dt = this.accumulated / 1000
      this.accumulated = 0
      if (this.callback) {
        this.callback(dt)
      }
    }

    this.rafId = requestAnimationFrame(this.loop.bind(this))
  }
}
