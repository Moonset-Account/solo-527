import { BaseScene } from './BaseScene.js'
import { LEVELS } from '../data/levels.js'

export class LearningScene extends BaseScene {
  constructor(ctx, canvas, services) {
    super(ctx, canvas, services)
    this.selectedCardIdx = null
    this.cardDetailAlpha = 0
    this.showDetail = false
    this._setupUI()
  }

  _setupUI() {
    this.uiElements = []
    this.createButton(30, 25, 120, 50, {
      text: '返回', fontSize: 22, bgColor: '#5c4033', hoverBgColor: '#7a5643',
      textColor: '#fff', borderColor: '#3d2817', icon: 'back',
      onClick: () => this.services.sceneManager.changeScene('menu')
    })
  }

  _getAllCards() {
    const result = []
    LEVELS.forEach(level => {
      if (level.learningCard) {
        result.push({
          ...level.learningCard,
          levelId: level.id,
          levelName: level.name,
          unlocked: this.services.saveSystem.isLearningCardUnlocked(level.learningCard.id)
        })
      }
    })
    result.push({
      id: 'card_basic_pingze', title: '平仄基础',
      content: '平仄是诗词的声调格律。平声平直，仄声曲折。普通话中，第一、二声为平声，第三、四声为仄声。古代还有入声字，已并入现代四声。',
      keyPoints: ['一声二声 = 平声', '三声四声 = 仄声', '平仄交替产生韵律美'],
      levelId: -1, levelName: '基础知识', unlocked: true
    })
    result.push({
      id: 'card_rhyme', title: '押韵规则',
      content: '押韵是在诗句的句尾使用韵母相同或相近的字。绝句二四句必须押韵，律诗二四六八句押韵。韵脚字一般为平声。',
      keyPoints: ['绝句：二四句押韵', '律诗：二四六八句押韵', '韵脚以平声为主'],
      levelId: -2, levelName: '基础知识', unlocked: true
    })
    return result
  }

  handleClick(pos) {
    if (super.handleClick(pos)) return true
    if (this.showDetail && this.cardDetailAlpha > 0.8) {
      const cx = this.width / 2, cy = this.height / 2
      const bx = cx + 240, by = cy - 220
      if (pos.x >= bx && pos.x <= bx + 40 && pos.y >= by && pos.y <= by + 40) {
        this._closeDetail()
        return true
      }
      const sx = cx - 260, sy = cy + 160
      if (pos.x >= sx && pos.x <= sx + 160 && pos.y >= sy && pos.y <= sy + 50) {
        this._closeDetail()
        return true
      }
      return true
    }
    const cards = this._getAllCards()
    const cols = 3, cw = 280, ch = 200, gx = 30, gy = 30
    const tw = cols * cw + (cols - 1) * gx
    const sx = (this.width - tw) / 2, sy = 160
    cards.forEach((card, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const x = sx + col * (cw + gx), y = sy + row * (ch + gy)
      if (pos.x >= x && pos.x <= x + cw && pos.y >= y && pos.y <= y + ch) {
        if (card.unlocked) {
          this.services.audioManager.playSfx('card_flip')
          this.selectedCardIdx = i
          this._openDetail()
        } else {
          this.services.audioManager.playSfx('wrong')
          this.services.uiState.addToast('通关对应关卡解锁此卡片', 'warning', 2000)
        }
        return true
      }
    })
    return false
  }

  _openDetail() {
    this.showDetail = true
    this.startAnimation(0.4, p => { this.cardDetailAlpha = p })
  }

  _closeDetail() {
    this.startAnimation(0.3, p => { this.cardDetailAlpha = 1 - p }, () => {
      this.showDetail = false
      this.selectedCardIdx = null
    })
  }

  handleMouseMove(pos) {
    const result = super.handleMouseMove(pos)
    if (result) return result
    if (this.showDetail) return null
    const cards = this._getAllCards()
    const cols = 3, cw = 280, ch = 200, gx = 30, gy = 30
    const tw = cols * cw + (cols - 1) * gx
    const sx = (this.width - tw) / 2, sy = 160
    let found = null
    cards.forEach((card, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const x = sx + col * (cw + gx), y = sy + row * (ch + gy)
      if (pos.x >= x && pos.x <= x + cw && pos.y >= y && pos.y <= y + ch) {
        found = { type: 'card', index: i }
      }
    })
    this.hoveredCardIdx = found?.index
    return found
  }

  update(dt) {
    super.update(dt)
    if (!this.showDetail && this.cardDetailAlpha > 0 && !this.animations.length) {
      this.cardDetailAlpha = Math.max(0, this.cardDetailAlpha - dt * 3)
    }
  }

  render() {
    this.drawBackground()
    this.drawTitle('学 习 卡 片', 95, { fontSize: 52, color: '#daa520', strokeColor: '#8b4513' })
    this.drawSubtitle('通关解锁更多诗词知识', 140, { fontSize: 20, alpha: 0.75 })
    this._renderCards()
    if (this.showDetail || this.cardDetailAlpha > 0) this._renderDetail()
    for (const el of this.uiElements) if (el.type === 'button') this.drawButton(el)
    this._renderToasts()
  }

  _renderCards() {
    const ctx = this.ctx, cards = this._getAllCards()
    const cols = 3, cw = 280, ch = 200, gx = 30, gy = 30
    const tw = cols * cw + (cols - 1) * gx
    const sx = (this.width - tw) / 2, sy = 160
    cards.forEach((card, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const x = sx + col * (cw + gx), y = sy + row * (ch + gy)
      const hov = this.hoveredCardIdx === i && card.unlocked
      ctx.save()
      if (hov) { ctx.shadowColor = 'rgba(218,165,32,0.8)'; ctx.shadowBlur = 20; ctx.translate(x+cw/2,y+ch/2); ctx.scale(1.04,1.04); ctx.translate(-(x+cw/2),-(y+ch/2)) }
      this._drawRoundedRect(x, y, cw, ch, 16)
      const g = ctx.createLinearGradient(x, y, x, y + ch)
      if (card.unlocked) {
        g.addColorStop(0, hov ? 'rgba(80,60,100,0.95)' : 'rgba(60,45,80,0.9)')
        g.addColorStop(1, hov ? 'rgba(50,35,70,0.95)' : 'rgba(40,30,55,0.9)')
      } else {
        g.addColorStop(0, 'rgba(50,50,50,0.9)'); g.addColorStop(1, 'rgba(30,30,30,0.9)')
      }
      ctx.fillStyle = g; ctx.fill()
      ctx.strokeStyle = card.unlocked ? (hov ? '#ffd700' : '#8b6914') : '#555'
      ctx.lineWidth = card.unlocked ? 3 : 2; ctx.stroke()
      ctx.font = 'bold 28px "Ma Shan Zheng", KaiTi, serif'
      ctx.textAlign = 'center'; ctx.fillStyle = card.unlocked ? '#ffd700' : '#888'
      ctx.fillText(card.title, x + cw/2, y + 60)
      ctx.font = '16px "ZCOOL XiaoWei", KaiTi, serif'
      ctx.fillStyle = card.unlocked ? '#d4a574' : '#666'
      ctx.fillText(card.levelName, x + cw/2, y + 100)
      if (!card.unlocked) {
        ctx.font = '56px serif'; ctx.fillStyle = '#555'
        ctx.fillText('🔒', x + cw/2, y + 155)
      } else {
        ctx.font = '15px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = 'rgba(240,230,210,0.6)'
        ctx.fillText(`★  ${card.keyPoints.length} 个要点`, x + cw/2, y + ch - 30)
      }
      ctx.restore()
    })
  }

  _renderDetail() {
    const ctx = this.ctx, cx = this.width / 2, cy = this.height / 2
    const cards = this._getAllCards()
    const card = cards[this.selectedCardIdx]
    if (!card) return
    ctx.save()
    ctx.globalAlpha = this.cardDetailAlpha
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, this.width, this.height)
    const w = 600, h = 480
    const scroll = this.services.resourceLoader.getImage('scroll')
    if (scroll) ctx.drawImage(scroll, cx - w/2, cy - h/2, w, h)
    ctx.font = 'bold 40px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'
    ctx.fillStyle = '#8b0000'; ctx.fillText(card.title, cx, cy - h/2 + 55)
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#8b6914'
    ctx.fillText(`— ${card.levelName} —`, cx, cy - h/2 + 95)
    const lines = this._wrapText(card.content, 42)
    ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#2c1810'; ctx.textAlign = 'left'
    const startX = cx - w/2 + 60
    lines.forEach((line, i) => { ctx.fillText(line, startX, cy - 80 + i * 32) })
    const kpY = cy - 80 + lines.length * 32 + 45
    ctx.font = 'bold 22px "Ma Shan Zheng", KaiTi, serif'; ctx.fillStyle = '#8b4513'; ctx.textAlign = 'center'
    ctx.fillText('· 核心要点 ·', cx, kpY)
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#5c4033'; ctx.textAlign = 'left'
    card.keyPoints.forEach((kp, i) => { ctx.fillText(`◆ ${kp}`, startX, kpY + 45 + i * 32) })
    const bx = cx + w/2 - 60, by = cy - h/2 + 15
    this._drawRoundedRect(bx, by, 40, 40, 20)
    ctx.fillStyle = '#c9302c'; ctx.fill(); ctx.strokeStyle = '#8b0000'; ctx.lineWidth = 2; ctx.stroke()
    ctx.font = 'bold 22px serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('✕', bx + 20, by + 21)
    const sx = cx - 80, sy = cy + h/2 - 80
    this._drawRoundedRect(sx, sy, 160, 50, 12)
    const bg = ctx.createLinearGradient(sx, sy, sx, sy + 50)
    bg.addColorStop(0, '#2e5a8b'); bg.addColorStop(1, '#1a3a5c')
    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#f0e6d2'; ctx.lineWidth = 2; ctx.stroke()
    ctx.font = 'bold 22px "Ma Shan Zheng", KaiTi, serif'; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
    ctx.fillText('关 闭', sx + 80, sy + 26)
    ctx.restore()
  }

  _wrapText(text, maxChars) {
    const lines = []
    for (let i = 0; i < text.length; i += maxChars) {
      lines.push(text.substr(i, maxChars))
    }
    return lines
  }

  _renderToasts() {
    const toasts = this.services.uiState.get('toasts') || []
    const ctx = this.ctx, now = Date.now()
    toasts.forEach((t, idx) => {
      const elapsed = now - t.createdAt
      const a = elapsed < t.duration * 0.2 ? elapsed / (t.duration * 0.2) :
                elapsed > t.duration * 0.8 ? (t.duration - elapsed) / (t.duration * 0.2) : 1
      if (a <= 0) return
      const y = 80 + idx * 55
      ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif'
      const tw = ctx.measureText(t.message).width + 60
      ctx.save()
      ctx.globalAlpha = Math.max(0, a)
      this._drawRoundedRect((this.width - tw) / 2, y, tw, 45, 12)
      const colors = { info: 'rgba(46,90,139,0.95)', success: 'rgba(0,168,107,0.95)', warning: 'rgba(218,165,32,0.95)', error: 'rgba(201,48,44,0.95)' }
      ctx.fillStyle = colors[t.type] || colors.info; ctx.fill()
      ctx.strokeStyle = '#f0e6d2'; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = '#f0e6d2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(t.message, this.width / 2, y + 23)
      ctx.restore()
    })
  }
}
