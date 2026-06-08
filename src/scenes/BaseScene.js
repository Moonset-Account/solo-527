export class BaseScene {
  constructor(ctx, canvas, services) {
    this.ctx = ctx
    this.canvas = canvas
    this.services = services
    this.width = canvas.width
    this.height = canvas.height
    this.uiElements = []
    this.animations = []
    this.time = 0
    this.hoveredElement = null
  }

  onEnter() {}

  onExit() {}

  update(deltaTime) {
    this.time += deltaTime

    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i]
      anim.progress = Math.min(1, anim.progress + deltaTime / anim.duration)
      anim.onUpdate?.(anim.progress)
      if (anim.progress >= 1) {
        anim.onComplete?.()
        this.animations.splice(i, 1)
      }
    }
  }

  render() {}

  handleClick(pos) {
    for (let i = this.uiElements.length - 1; i >= 0; i--) {
      const el = this.uiElements[i]
      if (this._isPointInElement(pos, el) && el.onClick && !el.disabled) {
        this.services.audioManager.playSfx('button_click')
        el.onClick(el, pos)
        return true
      }
    }
    return false
  }

  handleMouseMove(pos) {
    let found = null
    for (let i = this.uiElements.length - 1; i >= 0; i--) {
      const el = this.uiElements[i]
      if (this._isPointInElement(pos, el)) {
        found = el
        break
      }
    }
    if (found !== this.hoveredElement) {
      if (this.hoveredElement) {
        this.hoveredElement.isHovered = false
        this.hoveredElement.onHoverEnd?.()
      }
      this.hoveredElement = found
      if (found) {
        found.isHovered = true
        found.onHoverStart?.()
      }
    }
    return found
  }

  handleKeyDown(key) {}

  _isPointInElement(pos, el) {
    if (el.shape === 'rect') {
      return pos.x >= el.x && pos.x <= el.x + el.width &&
             pos.y >= el.y && pos.y <= el.y + el.height
    } else if (el.shape === 'circle') {
      const dx = pos.x - el.x
      const dy = pos.y - el.y
      return dx * dx + dy * dy <= el.radius * el.radius
    }
    return false
  }

  addUIElement(el) {
    if (!el.shape) el.shape = 'rect'
    if (!el.isHovered) el.isHovered = false
    this.uiElements.push(el)
    return el
  }

  createButton(x, y, width, height, options = {}) {
    return this.addUIElement({
      shape: 'rect',
      type: 'button',
      x, y, width, height,
      text: options.text || '',
      fontSize: options.fontSize || 24,
      color: options.color || '#2c1810',
      bgColor: options.bgColor || '#d4a574',
      hoverBgColor: options.hoverBgColor || '#e6c49a',
      textColor: options.textColor || '#2c1810',
      borderColor: options.borderColor || '#8b4513',
      borderWidth: options.borderWidth || 2,
      radius: options.radius || 12,
      disabled: options.disabled || false,
      icon: options.icon || null,
      onClick: options.onClick,
      onHoverStart: options.onHoverStart,
      onHoverEnd: options.onHoverEnd
    })
  }

  startAnimation(duration, onUpdate, onComplete) {
    this.animations.push({
      progress: 0,
      duration,
      onUpdate,
      onComplete
    })
  }

  drawBackground() {
    const { width, height } = this
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#16213e')
    gradient.addColorStop(0.5, '#1a1a2e')
    gradient.addColorStop(1, '#0f3460')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, width, height)

    this._drawStars()
    this._drawDecorativeBorders()
  }

  _drawStars() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    const seed = 12345
    for (let i = 0; i < 50; i++) {
      const x = ((seed * (i + 1) * 7) % this.width)
      const y = ((seed * (i + 1) * 13) % (this.height * 0.6))
      const size = 1 + (i % 3) * 0.5
      const alpha = 0.3 + Math.sin(this.time * 2 + i) * 0.2
      this.ctx.globalAlpha = alpha
      this.ctx.beginPath()
      this.ctx.arc(x, y, size, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
  }

  _drawDecorativeBorders() {
    const ctx = this.ctx
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)'
    ctx.lineWidth = 2

    const padding = 20
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding + 40, padding)
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, padding + 40)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(this.width - padding, padding)
    ctx.lineTo(this.width - padding - 40, padding)
    ctx.moveTo(this.width - padding, padding)
    ctx.lineTo(this.width - padding, padding + 40)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(padding, this.height - padding)
    ctx.lineTo(padding + 40, this.height - padding)
    ctx.moveTo(padding, this.height - padding)
    ctx.lineTo(padding, this.height - padding - 40)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(this.width - padding, this.height - padding)
    ctx.lineTo(this.width - padding - 40, this.height - padding)
    ctx.moveTo(this.width - padding, this.height - padding)
    ctx.lineTo(this.width - padding, this.height - padding - 40)
    ctx.stroke()
  }

  drawButton(el) {
    const ctx = this.ctx
    const { x, y, width, height, radius, isHovered, disabled } = el

    ctx.save()
    if (disabled) {
      ctx.globalAlpha = 0.5
    }

    const bgColor = isHovered && !disabled ? el.hoverBgColor : el.bgColor
    this._drawRoundedRect(x, y, width, height, radius)

    const gradient = ctx.createLinearGradient(x, y, x, y + height)
    gradient.addColorStop(0, bgColor)
    gradient.addColorStop(1, this._adjustColor(bgColor, -20))
    ctx.fillStyle = gradient
    ctx.fill()

    if (el.borderWidth > 0) {
      ctx.strokeStyle = el.borderColor
      ctx.lineWidth = el.borderWidth
      ctx.stroke()
    }

    if (isHovered && !disabled) {
      ctx.shadowColor = 'rgba(218, 165, 32, 0.6)'
      ctx.shadowBlur = 15
      ctx.strokeStyle = '#daa520'
      ctx.lineWidth = 2
      this._drawRoundedRect(x + 2, y + 2, width - 4, height - 4, radius - 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    if (el.icon) {
      this._drawIcon(el.icon, x + 15, y + height / 2, el.fontSize * 0.8)
    }

    if (el.text) {
      ctx.fillStyle = el.textColor
      ctx.font = `${el.fontSize}px 'Ma Shan Zheng', 'KaiTi', serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textX = el.icon ? x + width / 2 + 10 : x + width / 2
      ctx.fillText(el.text, textX, y + height / 2)
    }

    ctx.restore()
  }

  _drawRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  _drawIcon(type, x, y, size) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const icons = {
      'play': '▶',
      'settings': '⚙',
      'book': '📖',
      'back': '←',
      'hint': '💡',
      'retry': '↻',
      'home': '🏠',
      'star': '★',
      'coin': '◉',
      'sound': '🔊',
      'mute': '🔇'
    }
    ctx.fillText(icons[type] || '●', 0, 0)
    ctx.restore()
  }

  _adjustColor(color, amount) {
    const hex = color.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))
    return `rgb(${r}, ${g}, ${b})`
  }

  drawTitle(text, y, options = {}) {
    const ctx = this.ctx
    const fontSize = options.fontSize || 64
    const color = options.color || '#daa520'
    const strokeColor = options.strokeColor || '#8b4513'

    ctx.save()
    ctx.font = `${fontSize}px 'Ma Shan Zheng', 'KaiTi', serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 4

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 4
    ctx.strokeText(text, this.width / 2, y)

    const gradient = ctx.createLinearGradient(0, y - fontSize, 0, y + fontSize)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, '#ffe066')
    gradient.addColorStop(1, color)
    ctx.fillStyle = gradient
    ctx.fillText(text, this.width / 2, y)

    ctx.restore()
  }

  drawSubtitle(text, y, options = {}) {
    const ctx = this.ctx
    const fontSize = options.fontSize || 28
    const color = options.color || '#f0e6d2'

    ctx.save()
    ctx.font = `${fontSize}px 'ZCOOL XiaoWei', 'KaiTi', serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.globalAlpha = options.alpha || 0.9
    ctx.fillText(text, this.width / 2, y)
    ctx.restore()
  }
}
