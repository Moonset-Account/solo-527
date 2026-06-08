import { BaseScene } from './BaseScene.js'
import { LEVELS, getNextLevelId } from '../data/levels.js'

export class LevelSelectScene extends BaseScene {
  constructor(ctx, canvas, services) {
    super(ctx, canvas, services)
    this.scrollOffset = 0
    this.selectedLevel = null
    this._setupUI()
  }

  _setupUI() {
    this.uiElements = []

    this.createButton(40, 30, 120, 50, {
      text: '返 回',
      fontSize: 22,
      bgColor: '#5c4033',
      hoverBgColor: '#7a5643',
      textColor: '#fff',
      borderColor: '#3d2817',
      icon: 'back',
      onClick: () => this.services.sceneManager.changeScene('menu')
    })
  }

  _getLevelCardPosition(index) {
    const cols = 3
    const rows = Math.ceil(LEVELS.length / cols)
    const col = index % cols
    const row = Math.floor(index / cols)
    const cardWidth = 320
    const cardHeight = 200
    const gapX = 40
    const gapY = 30
    const totalWidth = cols * cardWidth + (cols - 1) * gapX
    const startX = (this.width - totalWidth) / 2
    const startY = 180

    return {
      x: startX + col * (cardWidth + gapX),
      y: startY + row * (cardHeight + gapY),
      width: cardWidth,
      height: cardHeight
    }
  }

  handleClick(pos) {
    if (super.handleClick(pos)) return true

    for (let i = 0; i < LEVELS.length; i++) {
      const pos2 = this._getLevelCardPosition(i)
      if (pos.x >= pos2.x && pos.x <= pos2.x + pos2.width &&
          pos.y >= pos2.y && pos.y <= pos2.y + pos2.height) {
        const level = LEVELS[i]
        if (this.services.saveSystem.isLevelUnlocked(level.id)) {
          this.services.audioManager.playSfx('tile_pick')
          this.services.uiState.set('selectedLevel', level.id)
          this.services.sceneManager.changeScene('game')
        } else {
          this.services.audioManager.playSfx('wrong')
          this.services.uiState.addToast('请先完成前面的关卡解锁此章节', 'warning', 2500)
        }
        return true
      }
    }
    return false
  }

  handleMouseMove(pos) {
    const result = super.handleMouseMove(pos)
    if (result) return result

    let hovered = null
    for (let i = 0; i < LEVELS.length; i++) {
      const pos2 = this._getLevelCardPosition(i)
      if (pos.x >= pos2.x && pos.x <= pos2.x + pos2.width &&
          pos.y >= pos2.y && pos.y <= pos2.y + pos2.height) {
        hovered = { type: 'levelCard', index: i }
        break
      }
    }
    this.hoveredLevelCard = hovered?.index
    return hovered
  }

  render() {
    this.drawBackground()

    const mountain = this.services.resourceLoader.getImage('mountain')
    if (mountain) {
      this.ctx.globalAlpha = 0.3
      this.ctx.drawImage(mountain, 0, this.height - 300, this.width, 300)
      this.ctx.globalAlpha = 1
    }

    this.drawTitle('选 择 关 卡', 100, {
      fontSize: 56,
      color: '#daa520',
      strokeColor: '#8b4513'
    })

    const totalCoins = this.services.saveSystem.get('totalCoins', 0)
    const totalStars = this.services.saveSystem.get('totalStars', 0)

    this._drawStatsBar(totalCoins, totalStars)

    for (let i = 0; i < LEVELS.length; i++) {
      this._drawLevelCard(i, LEVELS[i])
    }

    for (const el of this.uiElements) {
      if (el.type === 'button') this.drawButton(el)
    }

    this._renderToasts()
  }

  _drawStatsBar(coins, stars) {
    const ctx = this.ctx
    const x = this.width - 250
    const y = 35

    ctx.save()
    this._drawRoundedRect(x, y, 210, 45, 12)
    ctx.fillStyle = 'rgba(44, 24, 16, 0.8)'
    ctx.fill()
    ctx.strokeStyle = '#daa520'
    ctx.lineWidth = 2
    ctx.stroke()

    const coinImg = this.services.resourceLoader.getImage('coin')
    if (coinImg) {
      ctx.drawImage(coinImg, x + 15, y + 5, 36, 36)
    }
    ctx.font = 'bold 22px "ZCOOL XiaoWei", KaiTi, serif'
    ctx.fillStyle = '#ffd700'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${coins}`, x + 60, y + 23)

    ctx.fillStyle = '#ffd700'
    ctx.font = '26px serif'
    ctx.fillText('★', x + 120, y + 23)
    ctx.fillStyle = '#f0e6d2'
    ctx.fillText(`${stars}`, x + 150, y + 23)
    ctx.restore()
  }

  _drawLevelCard(index, level) {
    const ctx = this.ctx
    const pos = this._getLevelCardPosition(index)
    const unlocked = this.services.saveSystem.isLevelUnlocked(level.id)
    const saved = this.services.saveSystem.getLevelScore(level.id)
    const isHovered = this.hoveredLevelCard === index

    ctx.save()

    if (isHovered && unlocked) {
      ctx.shadowColor = 'rgba(218, 165, 32, 0.8)'
      ctx.shadowBlur = 25
    }

    const bgGradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + pos.height)
    if (unlocked) {
      bgGradient.addColorStop(0, isHovered ? '#3d3050' : '#2a2040')
      bgGradient.addColorStop(1, isHovered ? '#1e1838' : '#1a142e')
    } else {
      bgGradient.addColorStop(0, '#2a2a2a')
      bgGradient.addColorStop(1, '#1a1a1a')
    }

    this._drawRoundedRect(pos.x, pos.y, pos.width, pos.height, 16)
    ctx.fillStyle = bgGradient
    ctx.fill()

    ctx.strokeStyle = unlocked ? (isHovered ? '#daa520' : '#8b6914') : '#444'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.shadowBlur = 0

    const difficultyColors = ['#00a86b', '#2e5a8b', '#c9302c']
    const difficultyTexts = ['入门', '进阶', '挑战']

    ctx.fillStyle = difficultyColors[Math.min(level.difficulty - 1, 2)]
    ctx.font = 'bold 16px "ZCOOL XiaoWei", KaiTi, serif'
    ctx.textAlign = 'right'
    ctx.fillText(difficultyTexts[Math.min(level.difficulty - 1, 2)], pos.x + pos.width - 20, pos.y + 30)

    ctx.fillStyle = unlocked ? '#ffd700' : '#888'
    ctx.font = 'bold 24px "Ma Shan Zheng", KaiTi, serif'
    ctx.textAlign = 'left'
    ctx.fillText(level.name, pos.x + 20, pos.y + 30)

    ctx.fillStyle = unlocked ? '#d4a574' : '#666'
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'
    ctx.fillText(`词牌：${level.cipai}`, pos.x + 20, pos.y + 65)

    ctx.fillStyle = unlocked ? '#f0e6d2' : '#555'
    ctx.font = '16px "ZCOOL XiaoWei", KaiTi, serif'
    ctx.fillText(level.description, pos.x + 20, pos.y + 100)

    ctx.fillStyle = unlocked ? '#a08060' : '#555'
    ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif'
    ctx.fillText(`【${level.dynasty}】${level.poet}`, pos.x + 20, pos.y + 130)

    if (saved) {
      ctx.fillStyle = '#ffd700'
      ctx.font = '28px serif'
      ctx.textAlign = 'left'
      for (let s = 0; s < 3; s++) {
        ctx.globalAlpha = s < saved.stars ? 1 : 0.2
        ctx.fillText('★', pos.x + 20 + s * 32, pos.y + 170)
      }
      ctx.globalAlpha = 1

      ctx.fillStyle = '#f0e6d2'
      ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif'
      ctx.textAlign = 'right'
      ctx.fillText(`最高分：${saved.score}`, pos.x + pos.width - 20, pos.y + 175)
    } else if (unlocked) {
      ctx.fillStyle = '#666'
      ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif'
      ctx.textAlign = 'left'
      ctx.fillText('未通关', pos.x + 20, pos.y + 170)
    } else {
      ctx.fillStyle = '#555'
      ctx.font = '48px serif'
      ctx.textAlign = 'center'
      ctx.fillText('🔒', pos.x + pos.width / 2, pos.y + pos.height / 2 + 20)
    }

    ctx.restore()
  }

  _renderToasts() {
    const toasts = this.services.uiState.get('toasts') || []
    const ctx = this.ctx
    const now = Date.now()

    toasts.forEach((toast, idx) => {
      const elapsed = now - toast.createdAt
      const alpha = elapsed < toast.duration * 0.2 ? elapsed / (toast.duration * 0.2) :
                    elapsed > toast.duration * 0.8 ? (toast.duration - elapsed) / (toast.duration * 0.2) : 1
      if (alpha <= 0) return

      const y = 80 + idx * 55
      const text = toast.message
      ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif'
      const tw = ctx.measureText(text).width + 60

      ctx.save()
      ctx.globalAlpha = Math.max(0, alpha)
      this._drawRoundedRect((this.width - tw) / 2, y, tw, 45, 12)
      const colors = {
        info: 'rgba(46, 90, 139, 0.95)',
        success: 'rgba(0, 168, 107, 0.95)',
        warning: 'rgba(218, 165, 32, 0.95)',
        error: 'rgba(201, 48, 44, 0.95)'
      }
      ctx.fillStyle = colors[toast.type] || colors.info
      ctx.fill()
      ctx.strokeStyle = '#f0e6d2'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#f0e6d2'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, this.width / 2, y + 23)
      ctx.restore()
    })
  }
}
