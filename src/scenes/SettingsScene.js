import { BaseScene } from './BaseScene.js'

export class SettingsScene extends BaseScene {
  constructor(ctx, canvas, services) {
    super(ctx, canvas, services)
    this.tempSettings = this.services.saveSystem.getSettings()
    this.hoveredSlider = null
    this.draggingSlider = null
    this._sfxPreviewTimer = 0
    this._setupUI()
  }

  onEnter() {
    this.tempSettings = this.services.saveSystem.getSettings()
    this.services.audioManager.applySettings(this.tempSettings)
  }

  update(deltaTime) {
    super.update(deltaTime)
    if (this._sfxPreviewTimer > 0) this._sfxPreviewTimer -= deltaTime
  }

  _setupUI() {
    this.uiElements = []
    this.createButton(30, 25, 120, 50, {
      text: '返回', fontSize: 22, bgColor: '#5c4033', hoverBgColor: '#7a5643',
      textColor: '#fff', borderColor: '#3d2817', icon: 'back',
      onClick: () => this._onBack()
    })
    this.createButton(this.width / 2 - 100, this.height - 100, 200, 55, {
      text: '保存设置', fontSize: 24, bgColor: '#00a86b', hoverBgColor: '#00c87a',
      textColor: '#fff', borderColor: '#006040',
      onClick: () => this._saveSettings()
    })
    this.createButton(this.width / 2 - 280, this.height - 100, 140, 55, {
      text: '恢复默认', fontSize: 20, bgColor: '#8b4513', hoverBgColor: '#a0522d',
      textColor: '#fff', borderColor: '#5c2e0a',
      onClick: () => this._resetSettings()
    })
  }

  _onBack() {
    this.services.saveSystem.updateSettings(this.tempSettings)
    this.services.audioManager.applySettings(this.tempSettings)
    this.services.sceneManager.changeScene('menu')
  }

  _saveSettings() {
    this.services.saveSystem.updateSettings(this.tempSettings)
    this.services.audioManager.applySettings(this.tempSettings)
    this.services.uiState.addToast('设置已保存', 'success', 2000)
  }

  _resetSettings() {
    this.tempSettings = {
      sfxVolume: 0.8, bgmVolume: 0.3, sfxMuted: false, bgmMuted: false,
      difficulty: 'normal', showHints: true
    }
    this.services.audioManager.applySettings(this.tempSettings)
    this.services.uiState.addToast('已恢复默认设置', 'info', 1500)
  }

  handleMouseMove(pos) {
    const result = super.handleMouseMove(pos)
    if (result) return result
    if (this.draggingSlider) {
      this._updateSliderValue(this.draggingSlider, pos.x)
      if (this.draggingSlider === 'sfxVolume' && this._sfxPreviewTimer <= 0) {
        this.services.audioManager.playSfx('tile_pick')
        this._sfxPreviewTimer = 0.18
      }
      return { type: 'slider', key: this.draggingSlider }
    }
    let hovered = null
    ;['sfxVolume', 'bgmVolume'].forEach(key => {
      const r = this._getSliderRect(key)
      if (pos.x >= r.x - 10 && pos.x <= r.x + r.w + 10 && pos.y >= r.y - 10 && pos.y <= r.y + r.h + 10) {
        hovered = key
      }
    })
    this.hoveredSlider = hovered
    return hovered ? { type: 'slider', key: hovered } : null
  }

  handleClick(pos) {
    if (super.handleClick(pos)) return true
    const mutedBtns = [
      { key: 'sfxMuted', x: this.width/2 + 180, y: 200, w: 90, h: 36 },
      { key: 'bgmMuted', x: this.width/2 + 180, y: 290, w: 90, h: 36 }
    ]
    for (const b of mutedBtns) {
      if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
        this.tempSettings[b.key] = !this.tempSettings[b.key]
        this.services.audioManager.applySettings(this.tempSettings)
        this.services.audioManager.playSfx('button_click')
        return true
      }
    }
    const diffOptions = [
      { k: 'easy', x: this.width/2 - 180, label: '简单' },
      { k: 'normal', x: this.width/2 - 30, label: '普通' },
      { k: 'hard', x: this.width/2 + 120, label: '困难' }
    ]
    for (const o of diffOptions) {
      if (pos.x >= o.x && pos.x <= o.x + 140 && pos.y >= 390 && pos.y <= 390 + 50) {
        this.tempSettings.difficulty = o.k
        this.services.audioManager.playSfx('button_click')
        return true
      }
    }
    const hintX = this.width / 2 - 100
    if (pos.x >= hintX && pos.x <= hintX + 50 && pos.y >= 480 && pos.y <= 480 + 30) {
      this.tempSettings.showHints = !this.tempSettings.showHints
      this.services.audioManager.playSfx('button_click')
      return true
    }
    return false
  }

  handleKeyDown(key) {
    if (key === 'Escape') this._onBack()
  }

  handleMouseDown(pos) {
    for (const key of ['sfxVolume', 'bgmVolume']) {
      const r = this._getSliderRect(key)
      if (pos.x >= r.x - 15 && pos.x <= r.x + r.w + 15 && pos.y >= r.y - 15 && pos.y <= r.y + r.h + 15) {
        this.draggingSlider = key
        this._updateSliderValue(key, pos.x)
        if (key === 'sfxVolume') {
          this.services.audioManager.playSfx('tile_pick')
          this._sfxPreviewTimer = 0.2
        }
        return true
      }
    }
    return false
  }

  handleMouseUp() {
    if (this.draggingSlider) {
      this.services.audioManager.playSfx('button_click')
      this.draggingSlider = null
      return true
    }
    return false
  }

  _getSliderRect(key) {
    const baseX = this.width / 2 - 200
    const baseY = key === 'sfxVolume' ? 210 : 300
    return { x: baseX, y: baseY, w: 360, h: 8 }
  }

  _updateSliderValue(key, mouseX) {
    const r = this._getSliderRect(key)
    const ratio = Math.max(0, Math.min(1, (mouseX - r.x) / r.w))
    this.tempSettings[key] = Math.round(ratio * 100) / 100
    this.services.audioManager.applySettings(this.tempSettings)
  }

  render() {
    this.drawBackground()
    this.drawTitle('游 戏 设 置', 95, { fontSize: 52, color: '#daa520', strokeColor: '#8b4513' })
    this._drawSettingsPanel()
    for (const el of this.uiElements) if (el.type === 'button') this.drawButton(el)
    this._renderToasts()
  }

  _drawSettingsPanel() {
    const ctx = this.ctx
    const cx = this.width / 2, cy = 220
    ctx.save()
    this._drawRoundedRect(cx - 320, 160, 640, 380, 20)
    const g = ctx.createLinearGradient(0, 160, 0, 540)
    g.addColorStop(0, 'rgba(60,45,80,0.9)'); g.addColorStop(1, 'rgba(40,30,55,0.9)')
    ctx.fillStyle = g; ctx.fill()
    ctx.strokeStyle = '#8b6914'; ctx.lineWidth = 3; ctx.stroke()
    this._drawVolumeSlider('sfxVolume', '🔊  音效音量', 200)
    this._drawVolumeSlider('bgmVolume', '🎵  背景音乐', 290)
    this._drawMuteButton('sfxMuted', 200)
    this._drawMuteButton('bgmMuted', 290)
    this._drawDifficulty()
    this._drawHintsToggle()
    ctx.restore()
  }

  _drawVolumeSlider(key, label, y) {
    const ctx = this.ctx
    const r = this._getSliderRect(key)
    ctx.font = '22px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'left'
    ctx.fillStyle = '#f0e6d2'; ctx.fillText(label, r.x, y - 15)
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'right'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(`${Math.round(this.tempSettings[key] * 100)}%`, r.x + r.w, y - 15)
    this._drawRoundedRect(r.x, r.y, r.w, r.h, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill()
    const v = this.tempSettings[key]
    this._drawRoundedRect(r.x, r.y, r.w * v, r.h, 4)
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w * v, r.y)
    g.addColorStop(0, '#2e5a8b'); g.addColorStop(1, '#00a86b')
    ctx.fillStyle = g; ctx.fill()
    const knobX = r.x + r.w * v
    const hov = this.hoveredSlider === key
    ctx.save()
    ctx.shadowColor = hov ? '#ffd700' : 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = hov ? 12 : 4
    ctx.beginPath()
    ctx.arc(knobX, r.y + r.h / 2, hov ? 14 : 12, 0, Math.PI * 2)
    ctx.fillStyle = hov ? '#ffe066' : '#f0e6d2'; ctx.fill()
    ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 2; ctx.stroke()
    ctx.restore()
  }

  _drawMuteButton(key, y) {
    const ctx = this.ctx
    const x = this.width / 2 + 180, w = 90, h = 36
    const muted = this.tempSettings[key]
    this._drawRoundedRect(x, y - 10, w, h, 8)
    ctx.fillStyle = muted ? '#c9302c' : '#2e5a8b'; ctx.fill()
    ctx.strokeStyle = muted ? '#8b0000' : '#1a3a5c'; ctx.lineWidth = 2; ctx.stroke()
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'
    ctx.fillText(muted ? '已静音' : '静音', x + w/2, y + 8)
  }

  _drawDifficulty() {
    const ctx = this.ctx, cx = this.width / 2
    const y = 380
    ctx.font = '22px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'left'
    ctx.fillStyle = '#f0e6d2'; ctx.fillText('游戏难度', cx - 300, y + 10)
    const options = [
      { k: 'easy', x: cx - 180, label: '简单', desc: '新手友好' },
      { k: 'normal', x: cx - 30, label: '普通', desc: '平衡体验' },
      { k: 'hard', x: cx + 120, label: '困难', desc: '挑战高分' }
    ]
    const cur = this.tempSettings.difficulty
    options.forEach(o => {
      const sel = o.k === cur
      this._drawRoundedRect(o.x, y + 30, 140, 50, 10)
      const g = ctx.createLinearGradient(o.x, y + 30, o.x, y + 80)
      if (sel) { g.addColorStop(0, '#c9302c'); g.addColorStop(1, '#8b0000') }
      else { g.addColorStop(0, 'rgba(139,105,20,0.3)'); g.addColorStop(1, 'rgba(92,64,51,0.3)') }
      ctx.fillStyle = g; ctx.fill()
      ctx.strokeStyle = sel ? '#ffd700' : '#8b6914'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke()
      ctx.font = 'bold 20px "Ma Shan Zheng", KaiTi, serif'
      ctx.textAlign = 'center'; ctx.fillStyle = sel ? '#fff' : '#d4a574'
      ctx.fillText(o.label, o.x + 70, y + 50)
      ctx.font = '12px "ZCOOL XiaoWei", KaiTi, serif'
      ctx.fillStyle = sel ? '#ffe0e0' : '#888'
      ctx.fillText(o.desc, o.x + 70, y + 72)
    })
  }

  _drawHintsToggle() {
    const ctx = this.ctx, cx = this.width / 2
    const y = 460
    ctx.font = '22px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'left'
    ctx.fillStyle = '#f0e6d2'; ctx.fillText('显示提示', cx - 300, y + 25)
    const toggle = this.tempSettings.showHints
    const bx = cx - 100
    this._drawRoundedRect(bx, y + 10, 120, 40, 20)
    ctx.fillStyle = toggle ? '#00a86b' : '#555'; ctx.fill()
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke()
    ctx.save()
    ctx.beginPath()
    const knobX = toggle ? bx + 85 : bx + 35
    ctx.arc(knobX, y + 30, 15, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'; ctx.fill()
    ctx.strokeStyle = toggle ? '#006040' : '#333'; ctx.lineWidth = 2; ctx.stroke()
    ctx.restore()
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = toggle ? '#00ffa0' : '#aaa'
    ctx.textAlign = 'left'; ctx.fillText(toggle ? '已开启' : '已关闭', bx + 140, y + 36)
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
