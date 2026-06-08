export class ResourceLoader {
  constructor() {
    this.images = {}
    this.fontsLoaded = false
  }

  async loadAll() {
    await this._loadFonts()
    this._generateProceduralAssets()
    return true
  }

  async _loadFonts() {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready
        this.fontsLoaded = true
      } catch (e) {
        console.warn('Font loading timed out, proceeding anyway')
      }
    }
  }

  _generateProceduralAssets() {
    this.images.inkSplash = this._createInkSplash(200, 200)
    this.images.scroll = this._createScroll(600, 400)
    this.images.coin = this._createCoin(64, 64)
    this.images.character = this._createCharacter(120, 160)
    this.images.flower = this._createFlower(80, 80)
    this.images.mountain = this._createMountain(800, 300)
    this.images.bamboo = this._createBamboo(100, 400)
  }

  _createInkSplash(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    for (let i = 0; i < 30; i++) {
      const x = w / 2 + (Math.random() - 0.5) * w * 0.6
      const y = h / 2 + (Math.random() - 0.5) * h * 0.6
      const r = 15 + Math.random() * 40
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    return canvas
  }

  _createScroll(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#f5e6c8')
    gradient.addColorStop(0.5, '#fdf8ed')
    gradient.addColorStop(1, '#f5e6c8')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#8b6914'
    ctx.fillRect(0, 0, w, 8)
    ctx.fillRect(0, h - 8, w, 8)
    ctx.fillStyle = '#6b4f10'
    ctx.fillRect(0, 3, w, 2)
    ctx.fillRect(0, h - 5, w, 2)

    ctx.strokeStyle = 'rgba(139, 105, 20, 0.15)'
    ctx.lineWidth = 1
    for (let i = 20; i < h - 20; i += 25) {
      ctx.beginPath()
      ctx.moveTo(30, i)
      ctx.lineTo(w - 30, i)
      ctx.stroke()
    }

    return canvas
  }

  _createCoin(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 2 - 4

    const gradient = ctx.createRadialGradient(cx - r / 3, cy - r / 3, 0, cx, cy, r)
    gradient.addColorStop(0, '#ffed4e')
    gradient.addColorStop(0.5, '#ffd700')
    gradient.addColorStop(1, '#b8860b')

    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = '#8b6914'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = '#8b6914'
    ctx.fill()

    return canvas
  }

  _createCharacter(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    const cx = w / 2
    const cy = h / 2

    ctx.fillStyle = '#4a3728'
    ctx.beginPath()
    ctx.moveTo(cx, 10)
    ctx.quadraticCurveTo(cx - 35, 30, cx - 30, 70)
    ctx.lineTo(cx - 25, 90)
    ctx.lineTo(cx + 25, 90)
    ctx.lineTo(cx + 30, 70)
    ctx.quadraticCurveTo(cx + 35, 30, cx, 10)
    ctx.fill()

    ctx.fillStyle = '#f5d5b0'
    ctx.beginPath()
    ctx.arc(cx, 55, 28, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#2c2c2c'
    ctx.beginPath()
    ctx.arc(cx - 10, 52, 4, 0, Math.PI * 2)
    ctx.arc(cx + 10, 52, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#c9302c'
    ctx.beginPath()
    ctx.arc(cx, 65, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#2e5a8b'
    ctx.beginPath()
    ctx.moveTo(cx - 35, 85)
    ctx.quadraticCurveTo(cx - 45, 120, cx - 30, h - 10)
    ctx.lineTo(cx + 30, h - 10)
    ctx.quadraticCurveTo(cx + 45, 120, cx + 35, 85)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#daa520'
    ctx.beginPath()
    ctx.moveTo(cx - 10, 95)
    ctx.lineTo(cx, 140)
    ctx.lineTo(cx + 10, 95)
    ctx.closePath()
    ctx.fill()

    return canvas
  }

  _createFlower(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    const cx = w / 2
    const cy = h / 2

    ctx.fillStyle = '#ff69b4'
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6
      const px = cx + Math.cos(angle) * 18
      const py = cy + Math.sin(angle) * 18
      ctx.beginPath()
      ctx.ellipse(px, py, 15, 10, angle, 0, Math.PI * 2)
      ctx.fill()
    }

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12)
    gradient.addColorStop(0, '#ffeb3b')
    gradient.addColorStop(1, '#ff9800')
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    return canvas
  }

  _createMountain(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, 'rgba(30, 60, 114, 0.9)')
    gradient.addColorStop(1, 'rgba(42, 82, 152, 0.6)')
    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(80, 120)
    ctx.lineTo(160, 180)
    ctx.lineTo(240, 60)
    ctx.lineTo(350, 160)
    ctx.lineTo(450, 40)
    ctx.lineTo(550, 140)
    ctx.lineTo(650, 80)
    ctx.lineTo(750, 160)
    ctx.lineTo(w, 100)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.moveTo(220, 80)
    ctx.lineTo(240, 60)
    ctx.lineTo(260, 85)
    ctx.lineTo(240, 75)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(430, 60)
    ctx.lineTo(450, 40)
    ctx.lineTo(470, 65)
    ctx.lineTo(450, 55)
    ctx.closePath()
    ctx.fill()

    return canvas
  }

  _createBamboo(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#2d5016'
    ctx.fillRect(15, 0, 8, h)
    ctx.fillRect(50, 20, 8, h - 20)
    ctx.fillRect(75, 60, 6, h - 60)

    ctx.strokeStyle = '#1a3009'
    ctx.lineWidth = 2
    for (let y = 50; y < h; y += 60) {
      ctx.beginPath()
      ctx.moveTo(10, y)
      ctx.lineTo(28, y)
      ctx.stroke()
    }
    for (let y = 70; y < h; y += 60) {
      ctx.beginPath()
      ctx.moveTo(45, y)
      ctx.lineTo(63, y)
      ctx.stroke()
    }

    ctx.fillStyle = '#3d6b1c'
    for (let i = 0; i < 5; i++) {
      const baseX = 25
      const baseY = 100 + i * 70
      ctx.beginPath()
      ctx.ellipse(baseX + 20, baseY, 25, 8, Math.PI / 6, 0, Math.PI * 2)
      ctx.fill()
    }

    return canvas
  }

  getImage(name) {
    return this.images[name] || null
  }

  getAsset(name) {
    return this.images[name] || null
  }
}
