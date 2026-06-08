export class GameLoop {
  constructor(updateCallback, maxDelta = 1 / 30) {
    this.updateCallback = updateCallback
    this.maxDelta = maxDelta
    this.running = false
    this.lastTime = 0
    this.accumulator = 0
    this.fixedDelta = 1 / 60
    this.rafId = null
    this.frameCount = 0
    this.fps = 0
    this._fpsTimer = 0
    this._fpsFrames = 0
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this._loop()
  }

  stop() {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  _loop() {
    if (!this.running) return

    const now = performance.now()
    let delta = (now - this.lastTime) / 1000
    this.lastTime = now

    this._fpsTimer += delta
    this._fpsFrames++
    if (this._fpsTimer >= 1) {
      this.fps = this._fpsFrames
      this._fpsTimer = 0
      this._fpsFrames = 0
    }

    if (delta > this.maxDelta) {
      delta = this.maxDelta
    }

    this.accumulator += delta

    while (this.accumulator >= this.fixedDelta) {
      this.updateCallback(this.fixedDelta)
      this.accumulator -= this.fixedDelta
    }

    this.frameCount++
    this.rafId = requestAnimationFrame(() => this._loop())
  }

  getFPS() {
    return this.fps
  }
}
