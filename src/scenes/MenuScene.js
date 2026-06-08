import { BaseScene } from './BaseScene.js'

export class MenuScene extends BaseScene {
  constructor(ctx, canvas, services) {
    super(ctx, canvas, services)
    this.characterY = 0
    this.floatingOffset = 0
    this._setupUI()
  }

  onEnter() {
    this.services.audioManager.startBgm('peaceful')
  }

  _setupUI() {
    this.uiElements = []

    const cx = this.width / 2
    const startY = this.height / 2 - 20

    this.createButton(cx - 150, startY, 300, 70, {
      text: '开 始 游 戏',
      fontSize: 32,
      bgColor: '#c9302c',
      hoverBgColor: '#e84540',
      textColor: '#fff',
      borderColor: '#8b0000',
      icon: 'play',
      onClick: () => {
        this.services.sceneManager.changeScene('levelSelect')
      }
    })

    this.createButton(cx - 150, startY + 90, 300, 60, {
      text: '学 习 卡 片',
      fontSize: 26,
      bgColor: '#2e5a8b',
      hoverBgColor: '#3d72ab',
      textColor: '#fff',
      borderColor: '#1a3a5c',
      icon: 'book',
      onClick: () => {
        this.services.sceneManager.changeScene('learning')
      }
    })

    this.createButton(cx - 150, startY + 170, 300, 60, {
      text: '游 戏 设 置',
      fontSize: 26,
      bgColor: '#5c4033',
      hoverBgColor: '#7a5643',
      textColor: '#fff',
      borderColor: '#3d2817',
      icon: 'settings',
      onClick: () => {
        this.services.sceneManager.changeScene('settings')
      }
    })
  }

  update(deltaTime) {
    super.update(deltaTime)
    this.floatingOffset = Math.sin(this.time * 2) * 10
    this.characterY = this.height * 0.28 + this.floatingOffset
  }

  render() {
    this.drawBackground()

    const character = this.services.resourceLoader.getImage('character')
    if (character) {
      const scale = 1 + Math.sin(this.time * 3) * 0.02
      const cw = character.width * scale
      const ch = character.height * scale
      this.ctx.globalAlpha = 0.9
      this.ctx.drawImage(character, this.width / 2 - cw / 2, this.characterY - ch / 2, cw, ch)
      this.ctx.globalAlpha = 1
    }

    const flower = this.services.resourceLoader.getImage('flower')
    if (flower) {
      for (let i = 0; i < 8; i++) {
        const fx = (i * 180 + this.time * 30) % (this.width + 100) - 50
        const fy = 50 + i * 60 + Math.sin(this.time * 2 + i) * 20
        const fscale = 0.6 + (i % 3) * 0.2
        this.ctx.globalAlpha = 0.7
        this.ctx.drawImage(flower, fx, fy, flower.width * fscale, flower.height * fscale)
      }
      this.ctx.globalAlpha = 1
    }

    this.drawTitle('古诗词词牌拼接', this.height * 0.12, {
      fontSize: 72,
      color: '#daa520',
      strokeColor: '#8b4513'
    })
    this.drawSubtitle('· 平仄韵律 · 意象千古 ·', this.height * 0.2, {
      fontSize: 28,
      color: '#f0e6d2',
      alpha: 0.85
    })

    for (const el of this.uiElements) {
      if (el.type === 'button') {
        this.drawButton(el)
      }
    }

    this._drawFooter()
  }

  _drawFooter() {
    const ctx = this.ctx
    ctx.save()
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(240, 230, 210, 0.5)'
    ctx.fillText('点击按钮开始探索诗词之美', this.width / 2, this.height - 40)
    ctx.restore()
  }
}
