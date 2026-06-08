type GameEvent = {
  type: string
  x: number
  y: number
  key?: string
}

type EventCallback = (e: GameEvent) => void

const DEFAULT_MAPPING: Record<string, string> = {
  h: 'hint',
  z: 'undo',
  ' ': 'pause',
  Escape: 'menu',
  Enter: 'confirm',
}

export class InputManager {
  private canvas: HTMLCanvasElement
  private mapping: Record<string, string>
  private listeners: EventCallback[] = []
  private boundHandlers: {
    mousedown: (e: MouseEvent) => void
    mousemove: (e: MouseEvent) => void
    mouseup: (e: MouseEvent) => void
    touchstart: (e: TouchEvent) => void
    touchmove: (e: TouchEvent) => void
    touchend: (e: TouchEvent) => void
    keydown: (e: KeyboardEvent) => void
  }
  private active = false

  constructor(canvas: HTMLCanvasElement, mapping?: Record<string, string>) {
    this.canvas = canvas
    this.mapping = { ...DEFAULT_MAPPING, ...mapping }
    this.boundHandlers = {
      mousedown: this.onMouseDown.bind(this),
      mousemove: this.onMouseMove.bind(this),
      mouseup: this.onMouseUp.bind(this),
      touchstart: this.onTouchStart.bind(this),
      touchmove: this.onTouchMove.bind(this),
      touchend: this.onTouchEnd.bind(this),
      keydown: this.onKeyDown.bind(this),
    }
  }

  activate(): void {
    if (this.active) return
    this.active = true
    this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown)
    this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove)
    this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup)
    this.canvas.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false })
    this.canvas.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false })
    this.canvas.addEventListener('touchend', this.boundHandlers.touchend)
    window.addEventListener('keydown', this.boundHandlers.keydown)
  }

  deactivate(): void {
    if (!this.active) return
    this.active = false
    this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown)
    this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove)
    this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup)
    this.canvas.removeEventListener('touchstart', this.boundHandlers.touchstart)
    this.canvas.removeEventListener('touchmove', this.boundHandlers.touchmove)
    this.canvas.removeEventListener('touchend', this.boundHandlers.touchend)
    window.removeEventListener('keydown', this.boundHandlers.keydown)
  }

  on(cb: EventCallback): void {
    this.listeners.push(cb)
  }

  off(cb: EventCallback): void {
    this.listeners = this.listeners.filter((l) => l !== cb)
  }

  updateMapping(mapping: Record<string, string>): void {
    this.mapping = { ...DEFAULT_MAPPING, ...mapping }
  }

  private emit(event: GameEvent): void {
    for (const cb of this.listeners) {
      cb(event)
    }
  }

  private getCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  private onMouseDown(e: MouseEvent): void {
    const pos = this.getCanvasPos(e.clientX, e.clientY)
    this.emit({ type: 'select', x: pos.x, y: pos.y })
  }

  private onMouseMove(e: MouseEvent): void {
    const pos = this.getCanvasPos(e.clientX, e.clientY)
    this.emit({ type: 'drag', x: pos.x, y: pos.y })
  }

  private onMouseUp(e: MouseEvent): void {
    const pos = this.getCanvasPos(e.clientX, e.clientY)
    this.emit({ type: 'drop', x: pos.x, y: pos.y })
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return
    const pos = this.getCanvasPos(touch.clientX, touch.clientY)
    this.emit({ type: 'select', x: pos.x, y: pos.y })
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return
    const pos = this.getCanvasPos(touch.clientX, touch.clientY)
    this.emit({ type: 'drag', x: pos.x, y: pos.y })
  }

  private onTouchEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0]
    if (!touch) return
    const pos = this.getCanvasPos(touch.clientX, touch.clientY)
    this.emit({ type: 'drop', x: pos.x, y: pos.y })
  }

  private onKeyDown(e: KeyboardEvent): void {
    const action = this.mapping[e.key]
    if (action) {
      e.preventDefault()
      this.emit({ type: action, x: 0, y: 0, key: e.key })
    }
  }
}
