import type { GameCanvasState, AnimationState, PuzzleSlot, PuzzleChar } from '@/types'

const COLORS = {
  inkBlack: '#1a1a2e',
  ricePaper: '#f5f0e8',
  cinnabar: '#c0392b',
  indigo: '#2c6e8a',
} as const

const CARD_W = 64
const CARD_H = 80
const CARD_R = 10
const SLOT_GAP = 12

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dpr = 1
  private noiseCache: ImageData | null = null
  private noiseW = 0
  private noiseH = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to acquire 2D context')
    this.ctx = ctx
    this.dpr = window.devicePixelRatio || 1
  }

  resizeToContainer(): void {
    const parent = this.canvas.parentElement
    if (!parent) return
    const w = parent.clientWidth
    const h = parent.clientHeight
    this.dpr = window.devicePixelRatio || 1
    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.noiseCache = null
  }

  render(state: GameCanvasState): void {
    const w = this.canvas.width / this.dpr
    const h = this.canvas.height / this.dpr
    this.ctx.clearRect(0, 0, w, h)
    this.drawBackground(w, h)
    this.drawSlots(state.slots, w, h)
    this.drawChars(state, w, h)
    if (state.dragging) {
      this.drawDragTrail(state)
    }
    for (const anim of state.animations) {
      this.drawAnimation(anim)
    }
  }

  private drawBackground(w: number, h: number): void {
    const g = this.ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, COLORS.ricePaper)
    g.addColorStop(0.5, '#efe8d8')
    g.addColorStop(1, COLORS.ricePaper)
    this.ctx.fillStyle = g
    this.ctx.fillRect(0, 0, w, h)
    this.drawNoise(w, h)
  }

  private drawNoise(w: number, h: number): void {
    if (!this.noiseCache || this.noiseW !== Math.ceil(w) || this.noiseH !== Math.ceil(h)) {
      const iw = Math.ceil(w)
      const ih = Math.ceil(h)
      const offscreen = document.createElement('canvas')
      offscreen.width = iw
      offscreen.height = ih
      const octx = offscreen.getContext('2d')!
      const img = octx.createImageData(iw, ih)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 20 - 10
        d[i] = 245 + v
        d[i + 1] = 240 + v
        d[i + 2] = 232 + v
        d[i + 3] = 35
      }
      octx.putImageData(img, 0, 0)
      this.noiseCache = img
      this.noiseW = iw
      this.noiseH = ih
    }
    const tmp = document.createElement('canvas')
    tmp.width = this.noiseW
    tmp.height = this.noiseH
    tmp.getContext('2d')!.putImageData(this.noiseCache, 0, 0)
    this.ctx.drawImage(tmp, 0, 0)
  }

  private slotLayout(slots: PuzzleSlot[], canvasW: number): { x: number; y: number; slot: PuzzleSlot }[] {
    const total = slots.length * (CARD_W + SLOT_GAP) - SLOT_GAP
    const startX = (canvasW - total) / 2
    const y = canvasW * 0.25
    return slots.map((s, i) => ({ x: startX + i * (CARD_W + SLOT_GAP), y, slot: s }))
  }

  private drawSlots(slots: PuzzleSlot[], w: number, h: number): void {
    const layout = this.slotLayout(slots, w)
    for (const { x, y, slot } of layout) {
      this.drawRoundedCard(x, y, CARD_W, CARD_H, COLORS.ricePaper, COLORS.inkBlack, 0.3)
      if (slot.placedChar === null) {
        this.ctx.fillStyle = 'rgba(26,26,46,0.08)'
        this.roundRect(x, y, CARD_W, CARD_H, CARD_R)
        this.ctx.fill()
      }
      this.drawToneDot(x + CARD_W / 2, y + CARD_H - 10, slot.tone)
    }
  }

  private drawChars(state: GameCanvasState, w: number, _h: number): void {
    const layout = this.slotLayout(state.slots, w)
    const slotMap = new Map(layout.map((l) => [l.slot.index, l]))

    for (const ch of state.chars) {
      if (ch.id === state.dragging) continue
      let cx: number
      let cy: number
      if (ch.slotIndex !== null) {
        const sl = slotMap.get(ch.slotIndex)
        if (sl) {
          cx = sl.x
          cy = sl.y
        } else {
          continue
        }
      } else {
        const row = Math.floor(ch.originIndex / 8)
        const col = ch.originIndex % 8
        const poolY = w * 0.55 + row * (CARD_H + SLOT_GAP)
        const poolTotal = 8 * (CARD_W + SLOT_GAP) - SLOT_GAP
        const poolStartX = (w - poolTotal) / 2
        cx = poolStartX + col * (CARD_W + SLOT_GAP)
        cy = poolY
      }
      this.drawCharCard(cx, cy, ch)
    }

    if (state.dragging) {
      const ch = state.chars.find((c) => c.id === state.dragging)
      if (ch) {
        const cx = state.mouseX - state.dragOffsetX
        const cy = state.mouseY - state.dragOffsetY
        this.ctx.save()
        this.ctx.shadowColor = 'rgba(26,26,46,0.3)'
        this.ctx.shadowBlur = 12
        this.ctx.shadowOffsetY = 4
        this.drawCharCard(cx, cy, ch)
        this.ctx.restore()
      }
    }
  }

  private drawCharCard(x: number, y: number, ch: PuzzleChar): void {
    this.drawRoundedCard(x, y, CARD_W, CARD_H, '#ffffff', COLORS.inkBlack, 0.6)
    this.ctx.fillStyle = COLORS.inkBlack
    this.ctx.font = 'bold 32px serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(ch.char, x + CARD_W / 2, y + CARD_H / 2 - 6)
    this.drawToneDot(x + CARD_W / 2, y + CARD_H - 10, ch.tone)
  }

  private drawRoundedCard(
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke: string,
    strokeAlpha: number,
  ): void {
    this.ctx.save()
    this.ctx.fillStyle = fill
    this.roundRect(x, y, w, h, CARD_R)
    this.ctx.fill()
    this.ctx.strokeStyle = stroke
    this.ctx.globalAlpha = strokeAlpha
    this.ctx.lineWidth = 1.5
    this.drawInkWashBorder(x, y, w, h)
    this.ctx.globalAlpha = 1
    this.ctx.restore()
  }

  private drawInkWashBorder(x: number, y: number, w: number, h: number): void {
    this.ctx.beginPath()
    const steps = 40
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = x + t * w
      const jitter = (Math.random() - 0.5) * 1.5
      if (i === 0) this.ctx.moveTo(px, y + jitter)
      else this.ctx.lineTo(px, y + jitter)
    }
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const py = y + t * h
      const jitter = (Math.random() - 0.5) * 1.5
      this.ctx.lineTo(x + w + jitter, py)
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps
      const px = x + t * w
      const jitter = (Math.random() - 0.5) * 1.5
      this.ctx.lineTo(px, y + h + jitter)
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps
      const py = y + t * h
      const jitter = (Math.random() - 0.5) * 1.5
      this.ctx.lineTo(x + jitter, py)
    }
    this.ctx.closePath()
    this.ctx.stroke()
  }

  private drawToneDot(cx: number, cy: number, tone: string): void {
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    this.ctx.fillStyle = tone === 'ping' ? COLORS.indigo : tone === 'ze' ? COLORS.cinnabar : '#999'
    this.ctx.fill()
  }

  private drawDragTrail(state: GameCanvasState): void {
    const ch = state.chars.find((c) => c.id === state.dragging)
    if (!ch) return
    const cx = state.mouseX - state.dragOffsetX + CARD_W / 2
    const cy = state.mouseY - state.dragOffsetY + CARD_H / 2
    const g = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 40)
    g.addColorStop(0, 'rgba(26,26,46,0.15)')
    g.addColorStop(1, 'rgba(26,26,46,0)')
    this.ctx.fillStyle = g
    this.ctx.fillRect(cx - 40, cy - 40, 80, 80)
  }

  private drawAnimation(anim: AnimationState): void {
    const p = anim.progress
    switch (anim.type) {
      case 'ink_spread':
        this.drawInkSpread(anim.x, anim.y, p, anim.color)
        break
      case 'shake':
        break
      case 'bloom':
        this.drawBloom(anim.x, anim.y, p, anim.color)
        break
      case 'float':
        break
      case 'fade':
        this.drawFade(anim.x, anim.y, p, anim.text, anim.color)
        break
    }
  }

  drawShakeOffset(animations: AnimationState[]): number {
    let offset = 0
    for (const a of animations) {
      if (a.type === 'shake') {
        offset += Math.sin(a.progress * Math.PI * 6) * 8 * (1 - a.progress)
      }
    }
    return offset
  }

  drawFloatOffset(animations: AnimationState[]): number {
    let offset = 0
    for (const a of animations) {
      if (a.type === 'float') {
        offset += Math.sin(a.progress * Math.PI * 2) * 4
      }
    }
    return offset
  }

  private drawInkSpread(x: number, y: number, p: number, color?: string): void {
    const maxR = 50
    const r = maxR * p
    const c = color || COLORS.inkBlack
    this.ctx.save()
    this.ctx.globalAlpha = 1 - p
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, Math.PI * 2)
    this.ctx.fillStyle = c
    this.ctx.fill()
    this.ctx.restore()
  }

  private drawBloom(x: number, y: number, p: number, color?: string): void {
    const c = color || COLORS.cinnabar
    const spikes = 6
    const outerR = 30 * p
    const innerR = 12 * p
    this.ctx.save()
    this.ctx.globalAlpha = 1 - p * 0.7
    this.ctx.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes - Math.PI / 2
      const r = i % 2 === 0 ? outerR : innerR
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) this.ctx.moveTo(px, py)
      else this.ctx.lineTo(px, py)
    }
    this.ctx.closePath()
    this.ctx.fillStyle = c
    this.ctx.fill()
    this.ctx.restore()
  }

  private drawFade(x: number, y: number, p: number, text?: string, color?: string): void {
    if (!text) return
    const c = color || COLORS.inkBlack
    this.ctx.save()
    this.ctx.globalAlpha = 1 - p
    this.ctx.fillStyle = c
    this.ctx.font = '18px serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(text, x, y - p * 20)
    this.ctx.restore()
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + r, y)
    this.ctx.lineTo(x + w - r, y)
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    this.ctx.lineTo(x + w, y + h - r)
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    this.ctx.lineTo(x + r, y + h)
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    this.ctx.lineTo(x, y + r)
    this.ctx.quadraticCurveTo(x, y, x + r, y)
    this.ctx.closePath()
  }

  getCharPosition(ch: PuzzleChar, slots: PuzzleSlot[]): { x: number; y: number } {
    const w = this.getCanvasWidth()
    const layout = this.slotLayout(slots, w)
    const slotMap = new Map(layout.map((l) => [l.slot.index, l]))
    if (ch.slotIndex !== null) {
      const sl = slotMap.get(ch.slotIndex)
      if (sl) return { x: sl.x, y: sl.y }
    }
    const row = Math.floor(ch.originIndex / 8)
    const col = ch.originIndex % 8
    const poolY = w * 0.55 + row * (CARD_H + SLOT_GAP)
    const poolTotal = 8 * (CARD_W + SLOT_GAP) - SLOT_GAP
    const poolStartX = (w - poolTotal) / 2
    return { x: poolStartX + col * (CARD_W + SLOT_GAP), y: poolY }
  }

  getSlotAt(x: number, y: number, slots: PuzzleSlot[]): number | null {
    const w = this.getCanvasWidth()
    const layout = this.slotLayout(slots, w)
    for (const { x: sx, y: sy, slot } of layout) {
      if (x >= sx && x <= sx + CARD_W && y >= sy && y <= sy + CARD_H) {
        return slot.index
      }
    }
    return null
  }

  getCharAt(x: number, y: number, chars: PuzzleChar[], slots: PuzzleSlot[]): string | null {
    for (const ch of chars) {
      const pos = this.getCharPosition(ch, slots)
      if (x >= pos.x && x <= pos.x + CARD_W && y >= pos.y && y <= pos.y + CARD_H) {
        return ch.id
      }
    }
    return null
  }

  getUnplacedCharAt(x: number, y: number, chars: PuzzleChar[], slots: PuzzleSlot[]): string | null {
    for (const ch of chars) {
      if (ch.slotIndex !== null) continue
      const pos = this.getCharPosition(ch, slots)
      if (x >= pos.x && x <= pos.x + CARD_W && y >= pos.y && y <= pos.y + CARD_H) {
        return ch.id
      }
    }
    return null
  }

  getPlacedCharAt(x: number, y: number, chars: PuzzleChar[], slots: PuzzleSlot[]): { charId: string; slotIndex: number } | null {
    for (const ch of chars) {
      if (ch.slotIndex === null) continue
      const pos = this.getCharPosition(ch, slots)
      if (x >= pos.x && x <= pos.x + CARD_W && y >= pos.y && y <= pos.y + CARD_H) {
        return { charId: ch.id, slotIndex: ch.slotIndex }
      }
    }
    return null
  }

  getCanvasWidth(): number {
    return this.canvas.width / this.dpr
  }

  getCanvasHeight(): number {
    return this.canvas.height / this.dpr
  }
}
