import { BaseScene } from './BaseScene.js'
import { getLevelById, getNextLevelId, LEVELS } from '../data/levels.js'
import { ScoringSystem, PuzzleValidator } from '../core/PuzzleSystem.js'
import { analyzeTones, getToneDescription } from '../data/pingzeDict.js'

export class GameScene extends BaseScene {
  constructor(ctx, canvas, services) {
    super(ctx, canvas, services)
    this.level = null
    this.scoring = null
    this.validator = null
    this.gamePhase = 'intro'
    this.currentTime = 0
    this.currentLineIndex = 0
    this.currentBlankIndex = 0
    this.placedAnswers = {}
    this.reorderStates = {}
    this.selectedOption = null
    this.selectedReorderChar = null
    this.wrongMessage = null
    this.correctFlash = {}
    this.shakeAmount = 0
    this.summary = null
    this.hintShown = null
    this._slotStorage = {}
    this.resultButtons = []
    this._setupUI()
  }

  onEnter() {
    const levelId = this.services.uiState.get('selectedLevel') ?? 0
    this.level = getLevelById(levelId)
    if (!this.level) this.level = LEVELS[0]
    this.scoring = new ScoringSystem(this.level)
    this.validator = new PuzzleValidator(this.level)
    this.currentTime = this.level.timeLimit
    this.currentLineIndex = 0
    this.currentBlankIndex = 0
    this.placedAnswers = {}
    this.reorderStates = {}
    this.selectedOption = null
    this.selectedReorderChar = null
    this.gamePhase = 'intro'
    this.wrongMessage = null
    this.correctFlash = {}
    this.summary = null
    this.hintShown = null
    this._slotStorage = {}
    this.resultButtons = []
    this._initializePuzzleState()
    this.services.saveSystem.addStatistic('gamesPlayed', 1)
    this.services.audioManager.startBgm('exciting')
  }

  _initializePuzzleState() {
    const puzzle = this.level.puzzle
    if (puzzle.lines) {
      puzzle.lines.forEach((line, li) => {
        if (line.blanks) {
          line.blanks.forEach((_, bi) => {
            this.placedAnswers[`${li}_${bi}`] = null
          })
        }
      })
    }
    const allReorder = this._getAllReorderInfo()
    allReorder.forEach(info => {
      this.reorderStates[info.lineIdx] = info.shuffled.map((c, i) => ({
        char: c, originalIndex: i, placed: false
      }))
    })
  }

  _getAllReorderInfo() {
    const result = []
    const puzzle = this.level.puzzle
    if (puzzle.lines) {
      puzzle.lines.forEach((line, li) => {
        if (line.shuffled) {
          result.push({ lineIdx: li, shuffled: line.shuffled, text: line.text, pattern: line.pattern })
        }
      })
    }
    if (puzzle.reorderLines) {
      const baseIdx = puzzle.lines?.length || 0
      puzzle.reorderLines.forEach((line, ri) => {
        result.push({ lineIdx: baseIdx + ri, shuffled: line.shuffled, text: line.text, pattern: line.pattern })
      })
    }
    return result
  }

  _setupUI() {
    this.uiElements = []
    this.createButton(30, 25, 100, 45, {
      text: '退出', fontSize: 20, bgColor: '#5c4033', hoverBgColor: '#7a5643',
      textColor: '#fff', borderColor: '#3d2817', icon: 'back',
      onClick: () => this._exitGame()
    })
    this.createButton(this.width - 160, 25, 130, 45, {
      text: '提示', fontSize: 20, bgColor: '#2e5a8b', hoverBgColor: '#3d72ab',
      textColor: '#fff', borderColor: '#1a3a5c', icon: 'hint',
      onClick: () => this._showHint()
    })
    this.createButton(this.width - 310, 25, 130, 45, {
      text: '重试', fontSize: 20, bgColor: '#8b4513', hoverBgColor: '#a0522d',
      textColor: '#fff', borderColor: '#5c2e0a', icon: 'retry',
      onClick: () => this._resetLevel()
    })
  }

  _exitGame() { this.services.sceneManager.changeScene('levelSelect') }

  _resetLevel() { this.onEnter() }

  _showHint() {
    this.scoring.useHint()
    this.services.saveSystem.addStatistic('hintsUsed', 1)
    this.services.audioManager.playSfx('hint')
    const puzzle = this.level.puzzle
    if (puzzle.lines && puzzle.lines[this.currentLineIndex]) {
      const line = puzzle.lines[this.currentLineIndex]
      if (line.blanks && line.blanks[this.currentBlankIndex]) {
        const blankPos = line.blanks[this.currentBlankIndex]
        const correctChar = line.text[blankPos]
        if (line.hints && line.hints[this.currentBlankIndex]) {
          this.hintShown = { text: line.hints[this.currentBlankIndex] }
        } else {
          this.hintShown = { text: `正确答案是「${correctChar}」` }
        }
      } else if (line.question) {
        const correct = line.choices[line.correct]
        this.hintShown = { text: `与「${correct}」有关...` }
      }
    } else if (puzzle.hints && puzzle.hints.length) {
      this.hintShown = { text: puzzle.hints[0] }
    }
    setTimeout(() => { this.hintShown = null }, 4000)
  }

  update(deltaTime) {
    super.update(deltaTime)
    if (this.gamePhase === 'playing') {
      this.currentTime -= deltaTime
      if (this.currentTime <= 0) { this.currentTime = 0; this._onTimeUp() }
    }
    if (this.shakeAmount > 0) this.shakeAmount = Math.max(0, this.shakeAmount - deltaTime * 40)
    if (this.wrongMessage) { this.wrongMessage.timer -= deltaTime; if (this.wrongMessage.timer <= 0) this.wrongMessage = null }
    Object.keys(this.correctFlash).forEach(key => {
      this.correctFlash[key] -= deltaTime * 2
      if (this.correctFlash[key] <= 0) delete this.correctFlash[key]
    })
  }

  _onTimeUp() {
    this.gamePhase = 'fail'
    this.services.audioManager.playSfx('wrong')
    this.services.saveSystem.addStatistic('wrongAttempts', 1)
  }

  handleClick(pos) {
    if (this.gamePhase === 'intro') { this.gamePhase = 'playing'; return true }
    if (this.gamePhase === 'result') { return this._handleResultClick(pos) }
    if (this.gamePhase === 'fail') { return this._handleFailClick(pos) }
    if (this.gamePhase !== 'playing') return super.handleClick(pos)
    if (super.handleClick(pos)) return true
    this._handleTileClick(pos)
    return true
  }

  _handleResultClick(pos) {
    for (const btn of this.resultButtons) {
      if (pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
        this.services.audioManager.playSfx('button_click')
        btn.action()
        return true
      }
    }
    return false
  }

  _handleFailClick(pos) {
    const cx = this.width / 2, cy = this.height / 2
    if (pos.x >= cx - 110 && pos.x <= cx + 110 && pos.y >= cy + 80 && pos.y <= cy + 130) {
      this._resetLevel(); return true
    }
    if (pos.x >= cx - 110 && pos.x <= cx + 110 && pos.y >= cy + 150 && pos.y <= cy + 200) {
      this._exitGame(); return true
    }
    return false
  }

  _handleTileClick(pos) {
    const puzzle = this.level.puzzle
    if (puzzle.options && puzzle.options.length) {
      const cols = 8, cellW = 80, cellH = 70, gapX = 10, gapY = 10
      const totalW = cols * cellW + (cols - 1) * gapX
      const rows = Math.ceil(puzzle.options.length / cols)
      const totalH = rows * cellH + (rows - 1) * gapY
      const optionX = (this.width - totalW) / 2
      const lastLineEnd = this._getLastLineEndY()
      const optionY = lastLineEnd + 40
      if (pos.x >= optionX && pos.x <= optionX + totalW && pos.y >= optionY && pos.y <= optionY + totalH) {
        const col = Math.floor((pos.x - optionX) / (cellW + gapX))
        const row = Math.floor((pos.y - optionY) / (cellH + gapY))
        const idx = row * cols + col
        if (idx >= 0 && idx < puzzle.options.length) {
          this.selectedOption = idx
          this.services.audioManager.playSfx('tile_pick')
          this._placeSelectedOption()
          return
        }
      }
    }
    if (puzzle.lines) {
      for (let li = 0; li < puzzle.lines.length; li++) {
        const line = puzzle.lines[li]
        if (line.choices && line.question) {
          const choiceInfo = this._getChoiceRect(li)
          if (pos.x >= choiceInfo.x && pos.x <= choiceInfo.x + choiceInfo.w &&
              pos.y >= choiceInfo.y && pos.y <= choiceInfo.y + choiceInfo.h) {
            const cols = 2, gap = 20
            const cellW = (choiceInfo.w - gap) / cols
            const rows = Math.ceil(line.choices.length / cols)
            const cellH = (choiceInfo.h - (rows - 1) * gap) / rows
            const lx = pos.x - choiceInfo.x, ly = pos.y - choiceInfo.y
            const cc = Math.floor(lx / (cellW + gap))
            const rr = Math.floor(ly / (cellH + gap))
            const cidx = rr * cols + cc
            if (cidx >= 0 && cidx < line.choices.length) { this._validateChoice(li, cidx); return }
          }
        }
      }
    }
    this._handleReorderClick(pos)
  }

  _handleReorderClick(pos) {
    const reorderList = this._getAllReorderInfo()
    const lineSpacing = 230
    const baseY = 230
    let offsetIdx = 0
    for (let li = 0; li < (this.level.puzzle.lines?.length || 0); li++) {
      const line = this.level.puzzle.lines[li]
      if (line.blanks) offsetIdx++
    }
    reorderList.forEach(info => {
      const dispIdx = reorderList.indexOf(info)
      const ry = baseY + (offsetIdx > 0 ? offsetIdx * 150 : 0) + dispIdx * lineSpacing
      const slotW = 80, slotH = 80, gap = 15
      const charCount = info.text.length
      const totalW = charCount * slotW + (charCount - 1) * gap
      const startX = (this.width - totalW) / 2
      for (let si = 0; si < charCount; si++) {
        const sx = startX + si * (slotW + gap), sy = ry
        if (pos.x >= sx && pos.x <= sx + slotW && pos.y >= sy && pos.y <= sy + slotH) {
          const slots = this._getOrCreateSlots(info.lineIdx, charCount, ry)
          const slot = slots[si]
          if (this.selectedReorderChar && this.selectedReorderChar.lineIdx === info.lineIdx && !slot.char) {
            const pool = this.reorderStates[info.lineIdx]
            const charObj = pool[this.selectedReorderChar.poolIdx]
            pool[this.selectedReorderChar.poolIdx].placed = true
            slot.char = charObj.char; slot.poolIdx = this.selectedReorderChar.poolIdx
            this.services.audioManager.playSfx('tile_place')
            this.selectedReorderChar = null
            this._checkReorderComplete(info.lineIdx, info.text, info.pattern)
          } else if (slot.char) {
            const pool = this.reorderStates[info.lineIdx]
            pool[slot.poolIdx].placed = false
            slot.char = null; slot.poolIdx = null
            this.services.audioManager.playSfx('tile_pick')
          }
          return
        }
      }
      const pool = this.reorderStates[info.lineIdx]
      if (pool) {
        const py = ry + 130
        const cellW = 80, cellH = 80
        const ptw = pool.length * cellW + (pool.length - 1) * 15
        const psx = (this.width - ptw) / 2
        pool.forEach((charObj, pi) => {
          if (charObj.placed) return
          const px = psx + pi * (cellW + 15)
          if (pos.x >= px && pos.x <= px + cellW && pos.y >= py && pos.y <= py + cellH) {
            this.selectedReorderChar = { lineIdx: info.lineIdx, poolIdx: pi }
            this.services.audioManager.playSfx('tile_pick')
            return
          }
        })
      }
    })
  }

  _getOrCreateSlots(lineIdx, charCount, y) {
    if (this._slotStorage[lineIdx]) return this._slotStorage[lineIdx]
    const slotW = 80, slotH = 80, gap = 15
    const totalW = charCount * slotW + (charCount - 1) * gap
    const startX = (this.width - totalW) / 2
    const slots = []
    for (let i = 0; i < charCount; i++) {
      slots.push({ x: startX + i * (slotW + gap), y, w: slotW, h: slotH, char: null, poolIdx: null })
    }
    this._slotStorage[lineIdx] = slots
    return slots
  }

  _placeSelectedOption() {
    if (this.selectedOption === null) return
    const puzzle = this.level.puzzle
    const line = puzzle.lines[this.currentLineIndex]
    if (!line || !line.blanks) return
    const blankKey = `${this.currentLineIndex}_${this.currentBlankIndex}`
    if (this.placedAnswers[blankKey] !== null) return
    const char = puzzle.options[this.selectedOption]
    const result = this.validator.validateFill(this.currentLineIndex, this.currentBlankIndex, char)
    if (result.valid) {
      this.placedAnswers[blankKey] = char
      const scoreResult = this.scoring.addCorrectAnswer(this.level.difficulty, !result.toneWarning)
      this.services.uiState.addScore(scoreResult.points)
      this.correctFlash[blankKey] = 1
      this.services.audioManager.playSfx('correct')
      this.services.saveSystem.addStatistic('puzzlesSolved', 1)
      if (scoreResult.combo >= 3) this.services.uiState.addToast(`连击 x${scoreResult.combo}!`, 'success', 1500)
      this._advanceBlank()
      this._checkIfAllDone()
    } else {
      this.scoring.addWrongAnswer()
      this.services.uiState.resetCombo()
      this.services.saveSystem.addStatistic('wrongAttempts', 1)
      this.shakeAmount = 10
      this.services.audioManager.playSfx('wrong')
      this.wrongMessage = { reasons: result.reasons, timer: 4 }
    }
    this.selectedOption = null
  }

  _advanceBlank() {
    const puzzle = this.level.puzzle
    for (let li = 0; li < (puzzle.lines?.length || 0); li++) {
      const line = puzzle.lines[li]
      if (!line.blanks) continue
      for (let bi = 0; bi < line.blanks.length; bi++) {
        if (this.placedAnswers[`${li}_${bi}`] === null) {
          this.currentLineIndex = li; this.currentBlankIndex = bi; return
        }
      }
    }
  }

  _validateChoice(lineIdx, choiceIdx) {
    const result = this.validator.validateChoice(lineIdx, choiceIdx)
    const key = `choice_${lineIdx}`
    if (result.valid) {
      this.placedAnswers[key] = choiceIdx
      this.correctFlash[key] = 1
      const sr = this.scoring.addCorrectAnswer(this.level.difficulty, true)
      this.services.uiState.addScore(sr.points)
      this.services.audioManager.playSfx('correct')
      this.services.saveSystem.addStatistic('puzzlesSolved', 1)
      this._checkIfAllDone()
    } else {
      this.scoring.addWrongAnswer()
      this.services.uiState.resetCombo()
      this.services.saveSystem.addStatistic('wrongAttempts', 1)
      this.shakeAmount = 10
      this.services.audioManager.playSfx('wrong')
      this.wrongMessage = { reasons: result.reasons, timer: 4 }
    }
  }

  _checkReorderComplete(lineIdx, correctText, pattern) {
    const slots = this._slotStorage[lineIdx]
    if (!slots || slots.some(s => !s.char)) return
    const orderedChars = slots.map(s => s.char)
    const result = this.validator.validateReorder(lineIdx, orderedChars)
    const key = `reorder_${lineIdx}`
    if (result.valid) {
      this.correctFlash[key] = 1
      const sr = this.scoring.addCorrectAnswer(this.level.difficulty, true)
      this.services.uiState.addScore(sr.points)
      this.services.audioManager.playSfx('correct')
      this.services.saveSystem.addStatistic('puzzlesSolved', 1)
      this._checkIfAllDone()
    } else {
      slots.forEach(s => {
        const pool = this.reorderStates[lineIdx]
        if (pool && s.poolIdx !== null) pool[s.poolIdx].placed = false
        s.char = null; s.poolIdx = null
      })
      this.scoring.addWrongAnswer()
      this.services.uiState.resetCombo()
      this.services.saveSystem.addStatistic('wrongAttempts', 1)
      this.shakeAmount = 12
      this.services.audioManager.playSfx('wrong')
      this.wrongMessage = { reasons: result.reasons, timer: 5 }
    }
  }

  _checkIfAllDone() {
    const puzzle = this.level.puzzle
    let totalFill = 0, filled = 0
    if (puzzle.lines) puzzle.lines.forEach(line => { if (line.blanks) totalFill += line.blanks.length })
    Object.values(this.placedAnswers).forEach(v => { if (v !== null && typeof v !== 'string' || (typeof v === 'string' && v.length === 1)) filled++ })
    const fillDone = Object.keys(this.placedAnswers).filter(k => k.includes('_')).every(k => this.placedAnswers[k] !== null)
    const choiceCount = puzzle.lines?.filter(l => l.choices).length || 0
    const choiceDone = Object.keys(this.placedAnswers).filter(k => k.startsWith('choice_')).length >= choiceCount
    const reorderInfos = this._getAllReorderInfo()
    let reorderDone = true
    for (const info of reorderInfos) {
      const slots = this._slotStorage[info.lineIdx]
      if (!slots || slots.some(s => !s.char)) { reorderDone = false; break }
    }
    if (fillDone && choiceDone && reorderDone) this._onLevelComplete()
  }

  _onLevelComplete() {
    this.gamePhase = 'result'
    this.scoring.addTimeBonus(Math.floor(this.currentTime))
    this.summary = this.scoring.getSummary()
    this.services.audioManager.playSfx('level_complete')
    this.services.saveSystem.setLevelScore(this.level.id, this.summary.totalScore, this.summary.stars, this.summary.coins)
    const nextId = getNextLevelId(this.level.id)
    if (nextId !== null) this.services.saveSystem.unlockLevel(nextId)
    if (this.level.learningCard) this.services.saveSystem.unlockLearningCard(this.level.learningCard.id)
    const stats = this.services.saveSystem.get('statistics') || {}
    if (this.summary.stars === 3) this.services.saveSystem.set('statistics.perfectLevels', (stats.perfectLevels || 0) + 1)
    this.services.saveSystem.set('statistics.totalTimePlayed', (stats.totalTimePlayed || 0) + (this.level.timeLimit - this.currentTime))
    this._setupResultButtons()
  }

  _setupResultButtons() {
    this.resultButtons = []
    const cx = this.width / 2
    const nextId = getNextLevelId(this.level.id)
    let bx = cx - 340
    this.resultButtons.push({
      x: bx, y: this.height - 130, w: 180, h: 55, text: '重试本关',
      bgColor: '#8b4513', hoverColor: '#a0522d', action: () => this._resetLevel()
    })
    if (nextId !== null) {
      this.resultButtons.push({
        x: bx + 200, y: this.height - 130, w: 200, h: 55, text: '下一关',
        bgColor: '#00a86b', hoverColor: '#00c87a',
        action: () => { this.services.uiState.set('selectedLevel', nextId); this.services.sceneManager.changeScene('game') }
      })
      bx += 200
    }
    this.resultButtons.push({
      x: bx + 200 + (nextId === null ? 0 : 20), y: this.height - 130, w: 180, h: 55, text: '返回选关',
      bgColor: '#2e5a8b', hoverColor: '#3d72ab', action: () => this.services.sceneManager.changeScene('levelSelect')
    })
  }

  render() {
    const sx = this.shakeAmount > 0 ? (Math.random() - 0.5) * this.shakeAmount : 0
    const sy = this.shakeAmount > 0 ? (Math.random() - 0.5) * this.shakeAmount : 0
    this.ctx.save(); this.ctx.translate(sx, sy)
    this.drawBackground()
    this._drawBackgroundScene()
    this._drawHeader()
    if (this.gamePhase === 'intro') this._drawIntro()
    else if (this.gamePhase === 'playing') this._drawGameContent()
    else if (this.gamePhase === 'result') { this._drawGameContent(0.3); this._drawResult() }
    else if (this.gamePhase === 'fail') { this._drawGameContent(0.3); this._drawFail() }
    for (const el of this.uiElements) if (el.type === 'button') this.drawButton(el)
    if (this.hintShown) this._drawHint()
    if (this.wrongMessage) this._drawWrongFeedback()
    this._renderToasts()
    this.ctx.restore()
  }

  _drawBackgroundScene() {
    const bg = this.level?.background
    const img = this.services.resourceLoader.getImage(bg)
    if (img) { this.ctx.globalAlpha = 0.25; this.ctx.drawImage(img, 0, this.height - img.height * 0.8, this.width, img.height * 0.8); this.ctx.globalAlpha = 1 }
    const bamboo = this.services.resourceLoader.getImage('bamboo')
    if (bamboo) {
      this.ctx.globalAlpha = 0.4
      this.ctx.drawImage(bamboo, 0, 150, bamboo.width * 0.7, bamboo.height * 0.7)
      this.ctx.save(); this.ctx.translate(this.width, 0); this.ctx.scale(-1, 1)
      this.ctx.drawImage(bamboo, 0, 180, bamboo.width * 0.6, bamboo.height * 0.6)
      this.ctx.restore(); this.ctx.globalAlpha = 1
    }
  }

  _drawHeader() {
    const ctx = this.ctx
    this.drawTitle(this.level.name, 110, { fontSize: 44, color: '#daa520', strokeColor: '#8b4513' })
    ctx.save()
    ctx.font = '22px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'
    ctx.fillStyle = '#d4a574'
    ctx.fillText(`${this.level.cipai} · 【${this.level.dynasty}】${this.level.poet}`, this.width / 2, 150)
    ctx.restore()
    this._drawTimer(); this._drawScore()
  }

  _drawTimer() {
    const ctx = this.ctx, x = this.width / 2 - 150, y = 30, w = 300, h = 35
    ctx.save()
    this._drawRoundedRect(x, y, w, h, 8)
    ctx.fillStyle = 'rgba(44, 24, 16, 0.8)'; ctx.fill()
    ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 2; ctx.stroke()
    const ratio = Math.max(0, this.currentTime / this.level.timeLimit)
    const bc = ratio > 0.5 ? '#00a86b' : ratio > 0.2 ? '#daa520' : '#c9302c'
    ctx.fillStyle = bc
    this._drawRoundedRect(x + 4, y + 4, (w - 8) * ratio, h - 8, 6); ctx.fill()
    ctx.font = 'bold 18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#f0e6d2'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    const m = Math.floor(this.currentTime / 60), s = Math.floor(this.currentTime % 60)
    ctx.fillText(`⏱ ${m}:${s.toString().padStart(2, '0')}`, x + w / 2, y + h / 2)
    ctx.restore()
  }

  _drawScore() {
    const ctx = this.ctx, x = 160, y = 30, w = 140, h = 35
    ctx.save()
    this._drawRoundedRect(x, y, w, h, 8)
    ctx.fillStyle = 'rgba(44, 24, 16, 0.8)'; ctx.fill()
    ctx.strokeStyle = '#daa520'; ctx.lineWidth = 2; ctx.stroke()
    ctx.font = 'bold 20px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#ffd700'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`分数: ${this.services.uiState.get('score') || 0}`, x + w / 2, y + h / 2)
    const combo = this.services.uiState.get('combo') || 0
    if (combo >= 2) { ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px serif'; ctx.fillText(`x${combo}`, x + w + 30, y + h / 2) }
    ctx.restore()
  }

  _drawIntro() {
    const ctx = this.ctx, cx = this.width / 2, cy = this.height / 2
    ctx.save()
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)'; ctx.fillRect(0, 0, this.width, this.height)
    const scroll = this.services.resourceLoader.getImage('scroll')
    if (scroll) { ctx.globalAlpha = 0.98; ctx.drawImage(scroll, cx - 360, cy - 250, 720, 480); ctx.globalAlpha = 1 }
    ctx.font = 'bold 48px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#8b4513'
    ctx.fillText(this.level.name, cx, cy - 130)
    ctx.font = '26px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#5c4033'
    ctx.fillText(`【${this.level.dynasty}】${this.level.poet} · ${this.level.cipai}`, cx, cy - 80)
    ctx.font = '38px "Ma Shan Zheng", KaiTi, serif'; ctx.fillStyle = '#2c1810'
    ctx.fillText(this.level.description, cx, cy - 15)
    ctx.font = '22px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#8b6914'
    ctx.fillText(`目标分数：${this.level.scoreTarget} 分　｜　时间：${Math.floor(this.level.timeLimit/60)}分${this.level.timeLimit%60}秒`, cx, cy + 45)
    const pulse = 1 + Math.sin(this.time * 4) * 0.08
    ctx.save(); ctx.translate(cx, cy + 120); ctx.scale(pulse, pulse)
    this._drawRoundedRect(-140, -32, 280, 64, 18)
    const bg = ctx.createLinearGradient(0, -32, 0, 32); bg.addColorStop(0, '#c9302c'); bg.addColorStop(1, '#8b0000')
    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#5c0000'; ctx.lineWidth = 3; ctx.stroke()
    ctx.font = 'bold 30px "Ma Shan Zheng", KaiTi, serif'; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
    ctx.fillText('开 始 拼 接', 0, 0)
    ctx.restore()
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = 'rgba(92, 64, 51, 0.8)'
    ctx.fillText('（点击任意位置开始）', cx, cy + 200)
    ctx.restore()
  }

  _getLastLineEndY() {
    const puzzle = this.level.puzzle
    let y = 230
    if (puzzle.lines) {
      puzzle.lines.forEach(line => {
        if (line.blanks) y += 150
        else if (line.choices) y += 180
        else if (line.shuffled) y += 230
        else y += 80
      })
    }
    const reorderCount = this._getAllReorderInfo().length
    const reorderInLineCount = puzzle.lines?.filter(l => l.shuffled).length || 0
    y += (reorderCount - reorderInLineCount) * 230
    return y
  }

  _drawGameContent(alpha = 1) {
    this.ctx.save(); this.ctx.globalAlpha = alpha
    const puzzle = this.level.puzzle
    let y = 230
    if (puzzle.lines) {
      puzzle.lines.forEach((line, li) => {
        if (line.blanks) { this._drawFillLine(line, li, y); y += 150 }
        else if (line.choices) { this._drawChoiceLine(line, li, y); y += 180 }
        else if (line.shuffled) { this._drawReorderLineForLine(line, li, y); y += 230 }
        else { this._drawPlainText(line.text, y + 40); y += 80 }
      })
    }
    const extraReorders = this._getAllReorderInfo().filter(
      info => !(puzzle.lines && puzzle.lines[info.lineIdx]?.shuffled)
    )
    extraReorders.forEach((info, idx) => {
      this._drawReorderLineDirect(info, y); y += 230
    })
    if (puzzle.options && puzzle.options.length) this._drawOptions(y + 40)
    this.ctx.restore()
  }

  _drawPlainText(text, y) {
    const ctx = this.ctx; ctx.save()
    ctx.font = '42px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f0e6d2'
    ctx.fillText(text, this.width / 2, y); ctx.restore()
  }

  _drawFillLine(line, lineIdx, baseY) {
    const ctx = this.ctx, chars = line.text.split(''), toneAnalysis = analyzeTones(line.text)
    const cs = 68, gap = 12, tw = chars.length * cs + (chars.length - 1) * gap
    const sx = (this.width - tw) / 2
    chars.forEach((ch, ci) => {
      const x = sx + ci * (cs + gap), y = baseY
      const isBlank = line.blanks.includes(ci)
      const bi = line.blanks.indexOf(ci)
      const bk = `${lineIdx}_${bi}`
      const placed = isBlank ? this.placedAnswers[bk] : null
      const isCur = isBlank && bi === this.currentBlankIndex && lineIdx === this.currentLineIndex && placed === null
      const flash = this.correctFlash[bk] || 0
      ctx.save()
      if (isCur) { ctx.shadowColor = '#daa520'; ctx.shadowBlur = 20 }
      if (flash > 0) { ctx.shadowColor = '#00a86b'; ctx.shadowBlur = 25 * flash }
      this._drawRoundedRect(x, y, cs, cs, 8)
      if (isBlank && placed === null) {
        ctx.fillStyle = isCur ? 'rgba(218, 165, 32, 0.2)' : 'rgba(44, 24, 16, 0.6)'; ctx.fill()
        ctx.strokeStyle = isCur ? '#daa520' : '#8b6914'; ctx.lineWidth = isCur ? 3 : 2
        ctx.setLineDash(isCur ? [] : [6, 4]); ctx.stroke(); ctx.setLineDash([])
        if (isCur) { ctx.font = '16px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = 'rgba(218, 165, 32, 0.6)'; ctx.textAlign = 'center'; ctx.fillText('待填', x + cs/2, y + cs + 22) }
      } else {
        const g = ctx.createLinearGradient(x, y, x, y + cs)
        if (flash > 0) { g.addColorStop(0, `rgba(0, 200, 120, ${0.3 + flash*0.5})`); g.addColorStop(1, `rgba(0, 168, 107, ${0.2 + flash*0.4})`) }
        else { g.addColorStop(0, 'rgba(245, 230, 200, 0.15)'); g.addColorStop(1, 'rgba(212, 165, 116, 0.1)') }
        ctx.fillStyle = g; ctx.fill()
        ctx.strokeStyle = flash > 0 ? '#00a86b' : '#8b6914'; ctx.lineWidth = 2; ctx.stroke()
        ctx.font = '40px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = flash > 0 ? '#00ffa0' : '#f0e6d2'
        ctx.fillText(isBlank ? placed : ch, x + cs/2, y + cs/2 - 6)
      }
      ctx.shadowBlur = 0
      const tone = toneAnalysis[ci]?.tone || '中'
      ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'
      ctx.fillStyle = tone === '平' ? '#ff9999' : tone === '仄' ? '#66b3ff' : '#aaa'
      ctx.fillText(tone, x + cs/2, y + cs + 18)
      ctx.restore()
    })
    this._drawPatternGuide(line.pattern, baseY + cs + 42, chars.length, sx, cs, gap)
  }

  _drawPatternGuide(pattern, y, cc, sx, cs, gap) {
    if (!pattern) return
    const ctx = this.ctx; ctx.save()
    for (let i = 0; i < Math.min(cc, pattern.length); i++) {
      const cx = sx + i * (cs + gap) + cs/2
      const t = pattern[i]
      ctx.font = '12px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'
      ctx.fillStyle = t === '平' ? 'rgba(255,153,153,0.5)' : t === '仄' ? 'rgba(102,179,255,0.5)' : 'rgba(170,170,170,0.4)'
      ctx.fillText(`(${t})`, cx, y)
    }
    ctx.restore()
  }

  _getChoiceRect(lineIdx) {
    return { x: this.width / 2 - 280, y: 290 + lineIdx * 180, w: 560, h: 120 }
  }

  _drawChoiceLine(line, lineIdx, baseY) {
    const ctx = this.ctx, cx = this.width / 2
    const key = `choice_${lineIdx}`, answered = this.placedAnswers[key], flash = this.correctFlash[key] || 0
    ctx.save()
    ctx.font = '26px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f0e6d2'
    ctx.fillText(answered !== undefined ? line.text : line.question, cx, baseY + 10)
    const r = this._getChoiceRect(lineIdx), cols = 2, gap = 20
    const cw = (r.w - gap) / cols, rows = Math.ceil(line.choices.length / cols)
    const ch = (r.h - (rows - 1) * gap) / rows
    line.choices.forEach((choice, ci) => {
      const rr = Math.floor(ci / cols), cc = ci % cols
      const x = r.x + cc * (cw + gap), y = r.y + rr * (ch + gap)
      const isA = answered === ci
      ctx.save()
      if (isA && flash > 0) { ctx.shadowColor = '#00a86b'; ctx.shadowBlur = 20 * flash }
      this._drawRoundedRect(x, y, cw, ch, 10)
      const g = ctx.createLinearGradient(x, y, x, y + ch)
      if (isA) { g.addColorStop(0, 'rgba(0,168,107,0.5)'); g.addColorStop(1, 'rgba(0,128,80,0.4)') }
      else if (answered !== undefined && ci === line.correct) { g.addColorStop(0, 'rgba(218,165,32,0.3)'); g.addColorStop(1, 'rgba(139,105,20,0.3)') }
      else { g.addColorStop(0, 'rgba(212,165,116,0.15)'); g.addColorStop(1, 'rgba(139,105,20,0.1)') }
      ctx.fillStyle = g; ctx.fill()
      ctx.strokeStyle = isA ? '#00a86b' : answered !== undefined ? '#555' : '#8b6914'
      ctx.lineWidth = 2; ctx.stroke()
      ctx.font = 'bold 32px "Ma Shan Zheng", KaiTi, serif'
      ctx.fillStyle = isA ? '#00ffa0' : answered !== undefined ? '#888' : '#f0e6d2'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(choice, x + cw/2, y + ch/2)
      const tone = analyzeTones(choice)[0]?.tone
      if (tone) {
        ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif'
        ctx.fillStyle = tone === '平' ? 'rgba(255,153,153,0.8)' : tone === '仄' ? 'rgba(102,179,255,0.8)' : '#888'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(getToneDescription(tone), x + cw/2, y + ch - 10)
      }
      ctx.restore()
    })
    ctx.restore()
  }

  _drawReorderLineForLine(line, lineIdx, baseY) {
    const info = { lineIdx, text: line.text, pattern: line.pattern }
    this._drawReorderLineDirect(info, baseY)
  }

  _drawReorderLineDirect(info, baseY) {
    const { lineIdx, text, pattern } = info
    const ctx = this.ctx, cc = text.length, ta = analyzeTones(text)
    const slots = this._getOrCreateSlots(lineIdx, cc, baseY)
    const key = `reorder_${lineIdx}`, flash = this.correctFlash[key] || 0
    ctx.save()
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#a08060'
    ctx.fillText('（先点下方字，再点上方格子放置；点已放字可取回）', this.width / 2, baseY - 20)
    ctx.restore()
    slots.forEach((slot, si) => {
      const tone = ta[si]?.tone
      ctx.save()
      if (slot.char && flash > 0) { ctx.shadowColor = '#00a86b'; ctx.shadowBlur = 25 * flash }
      if (this.selectedReorderChar?.lineIdx === lineIdx && !slot.char) { ctx.shadowColor = '#daa520'; ctx.shadowBlur = 15 }
      this._drawRoundedRect(slot.x, slot.y, slot.w, slot.h, 10)
      const g = ctx.createLinearGradient(slot.x, slot.y, slot.x, slot.y + slot.h)
      if (slot.char) {
        if (flash > 0) { g.addColorStop(0, `rgba(0,200,120,${0.4+flash*0.4})`); g.addColorStop(1, `rgba(0,168,107,${0.3+flash*0.3})`) }
        else { g.addColorStop(0, 'rgba(245,230,200,0.2)'); g.addColorStop(1, 'rgba(212,165,116,0.12)') }
      } else { g.addColorStop(0, 'rgba(44,24,16,0.5)'); g.addColorStop(1, 'rgba(26,20,46,0.3)') }
      ctx.fillStyle = g; ctx.fill()
      ctx.strokeStyle = slot.char ? (flash > 0 ? '#00a86b' : '#8b6914') : (this.selectedReorderChar?.lineIdx === lineIdx ? '#daa520' : '#666')
      ctx.lineWidth = 2
      if (!slot.char) ctx.setLineDash([6, 4])
      ctx.stroke(); ctx.setLineDash([])
      if (slot.char) {
        ctx.font = '44px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = flash > 0 ? '#00ffa0' : '#f0e6d2'
        ctx.fillText(slot.char, slot.x + slot.w/2, slot.y + slot.h/2 - 6)
      } else {
        ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(218,165,32,0.4)'; ctx.textBaseline = 'middle'
        ctx.fillText(`${si+1}`, slot.x + slot.w/2, slot.y + slot.h/2)
      }
      if (tone) {
        ctx.font = '13px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = tone === '平' ? 'rgba(255,153,153,0.7)' : tone === '仄' ? 'rgba(102,179,255,0.7)' : '#888'
        ctx.fillText(tone, slot.x + slot.w/2, slot.y + slot.h + 16)
      }
      ctx.restore()
    })
    this._drawPatternGuide(pattern, baseY + 96, cc, slots[0].x, slots[0].w, 15)
    const pool = this.reorderStates[lineIdx]
    if (pool) {
      const py = baseY + 140, cw = 80, ch = 80
      const ptw = pool.length * cw + (pool.length - 1) * 15, psx = (this.width - ptw) / 2
      pool.forEach((co, pi) => {
        if (co.placed) return
        const x = psx + pi * (cw + 15), y = py
        const sel = this.selectedReorderChar?.lineIdx === lineIdx && this.selectedReorderChar?.poolIdx === pi
        ctx.save()
        if (sel) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20; ctx.translate(x+cw/2,y+ch/2); ctx.scale(1.1,1.1); ctx.translate(-(x+cw/2),-(y+ch/2)) }
        this._drawRoundedRect(x, y, cw, ch, 12)
        const pg = ctx.createLinearGradient(x, y, x, y + ch)
        pg.addColorStop(0, sel ? '#8b6914' : '#5c4033'); pg.addColorStop(1, sel ? '#a0522d' : '#3d2817')
        ctx.fillStyle = pg; ctx.fill()
        ctx.strokeStyle = sel ? '#ffd700' : '#8b4513'; ctx.lineWidth = 3; ctx.stroke()
        const tone = analyzeTones(co.char)[0]?.tone
        if (tone) {
          const sc = tone === '平' ? 'rgba(255,100,100,0.28)' : 'rgba(100,150,255,0.28)'
          ctx.fillStyle = sc; this._drawRoundedRect(x+3, y+3, cw-6, 10, 4); ctx.fill()
        }
        ctx.font = '44px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = sel ? '#ffe066' : '#f0e6d2'
        ctx.fillText(co.char, x + cw/2, y + ch/2 - 2)
        if (tone) {
          ctx.font = '11px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'
          ctx.fillStyle = tone === '平' ? 'rgba(255,180,180,0.9)' : tone === '仄' ? 'rgba(180,200,255,0.9)' : '#aaa'
          ctx.fillText(getToneDescription(tone), x + cw/2, y + ch - 8)
        }
        ctx.restore()
      })
    }
  }

  _drawOptions(baseY) {
    const ctx = this.ctx, puzzle = this.level.puzzle
    const cols = 8, cellW = 80, cellH = 70, gapX = 10, gapY = 10
    const rows = Math.ceil(puzzle.options.length / cols)
    const tw = cols * cellW + (cols - 1) * gapX
    const th = rows * cellH + (rows - 1) * gapY
    const sx = (this.width - tw) / 2
    ctx.save()
    ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#d4a574'
    ctx.fillText('— 选 字 区 —', this.width / 2, baseY - 15)
    puzzle.options.forEach((char, idx) => {
      const col = idx % cols, row = Math.floor(idx / cols)
      const x = sx + col * (cellW + gapX), y = baseY + row * (cellH + gapY)
      const sel = this.selectedOption === idx
      const tone = analyzeTones(char)[0]?.tone
      ctx.save()
      if (sel) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 18; ctx.translate(x+cellW/2,y+cellH/2); ctx.scale(1.08,1.08); ctx.translate(-(x+cellW/2),-(y+cellH/2)) }
      this._drawRoundedRect(x, y, cellW, cellH, 10)
      const g = ctx.createLinearGradient(x, y, x, y + cellH)
      g.addColorStop(0, sel ? '#c9a020' : '#6b4423'); g.addColorStop(1, sel ? '#e6c040' : '#4a2d15')
      ctx.fillStyle = g; ctx.fill()
      ctx.strokeStyle = sel ? '#ffe066' : '#8b4513'; ctx.lineWidth = 2; ctx.stroke()
      if (tone) {
        const sc = tone === '平' ? 'rgba(255,120,120,0.28)' : 'rgba(120,160,255,0.28)'
        ctx.fillStyle = sc; this._drawRoundedRect(x+3, y+3, cellW-6, 10, 4); ctx.fill()
      }
      ctx.font = '38px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = sel ? '#2c1810' : '#f0e6d2'
      ctx.fillText(char, x + cellW/2, y + cellH/2 + 2)
      if (tone) {
        ctx.font = '11px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = tone === '平' ? 'rgba(255,180,180,0.9)' : tone === '仄' ? 'rgba(180,200,255,0.9)' : '#aaa'
        ctx.fillText(getToneDescription(tone), x + cellW/2, y + cellH - 8)
      }
      ctx.restore()
    })
    ctx.font = '14px "ZCOOL XiaoWei", KaiTi, serif'; ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(212,165,116,0.6)'
    ctx.fillText('红底=平声，蓝底=仄声，点击字自动填入高亮空格', this.width / 2, baseY + th + 25)
    ctx.restore()
  }

  _drawHint() {
    const ctx = this.ctx, cx = this.width / 2, cy = 215
    const w = 480, h = 80
    ctx.save()
    const p = 1 + Math.sin(this.time * 6) * 0.02; ctx.translate(cx, cy); ctx.scale(p, p); ctx.translate(-cx, -cy)
    this._drawRoundedRect(cx-w/2, cy-h/2, w, h, 14)
    const g = ctx.createLinearGradient(cx-w/2, cy-h/2, cx+w/2, cy+h/2)
    g.addColorStop(0, 'rgba(46,90,139,0.98)'); g.addColorStop(1, 'rgba(30,60,100,0.98)')
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#daa520'; ctx.lineWidth = 3; ctx.stroke()
    ctx.shadowColor = 'rgba(218,165,32,0.8)'; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0
    ctx.font = '30px serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#ffd700'; ctx.fillText('💡', cx - w/2 + 25, cy + 6)
    ctx.font = 'bold 22px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#f0e6d2'; ctx.textAlign = 'center'
    ctx.fillText('提 示', cx, cy - h/2 + 30)
    ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#ffe066'
    ctx.fillText(this.hintShown.text, cx, cy + 18)
    ctx.restore()
  }

  _drawWrongFeedback() {
    const ctx = this.ctx, cx = this.width / 2, reasons = this.wrongMessage.reasons
    const lc = reasons.length + 1, h = 60 + lc * 30, w = 520
    let y = this.height - 120 - (lc - 1) * 10
    ctx.save()
    ctx.globalAlpha = Math.min(1, this.wrongMessage.timer * 1.5)
    this._drawRoundedRect(cx-w/2, y, w, h, 14)
    const g = ctx.createLinearGradient(cx-w/2, y, cx+w/2, y+h)
    g.addColorStop(0, 'rgba(139,0,0,0.96)'); g.addColorStop(1, 'rgba(100,0,0,0.96)')
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 3; ctx.stroke()
    ctx.font = '24px serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#ff6b6b'; ctx.fillText('✗', cx-w/2 + 25, y + 38)
    ctx.font = 'bold 22px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#ffcccc'; ctx.textAlign = 'center'
    ctx.fillText('答 案 不 正 确', cx, y + 38)
    reasons.forEach((r, i) => {
      ctx.font = '17px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#ffe0e0'; ctx.fillText(r, cx, y + 72 + i * 28)
    })
    ctx.restore()
  }

  _drawResult() {
    const ctx = this.ctx, cx = this.width / 2, cy = this.height / 2, s = this.summary
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, this.width, this.height)
    const sw = 620, sh = 500
    const scroll = this.services.resourceLoader.getImage('scroll')
    if (scroll) { ctx.globalAlpha = 0.98; ctx.drawImage(scroll, cx-sw/2, cy-sh/2-20, sw, sh); ctx.globalAlpha = 1 }
    ctx.font = 'bold 44px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#c9302c'
    ctx.fillText('· 通 关 成 功 ·', cx, cy - sh/2 + 45)
    const gi = s.grade
    ctx.save(); ctx.translate(cx, cy - sh/2 + 115)
    const gs = 1 + Math.sin(this.time * 5) * 0.06; ctx.scale(gs, gs)
    ctx.font = 'bold 80px "Ma Shan Zheng", KaiTi, serif'; ctx.fillStyle = gi.color
    ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 4; ctx.strokeText(gi.grade, 0, 0); ctx.fillText(gi.grade, 0, 0)
    ctx.restore()
    ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#5c4033'
    ctx.fillText(`评级：${gi.label}`, cx, cy - sh/2 + 165)
    for (let i = 0; i < 3; i++) {
      const sx = cx - 90 + i * 90, sy = cy - sh/2 + 210
      const filled = i < s.stars, sc = filled ? (1 + Math.sin(this.time*4+i) * 0.1) : 1
      ctx.save(); ctx.translate(sx, sy); ctx.scale(sc, sc)
      ctx.font = '46px serif'; ctx.textAlign = 'center'
      ctx.fillStyle = filled ? '#ffd700' : 'rgba(139,105,20,0.3)'
      if (filled) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15 }
      ctx.fillText('★', 0, 0); ctx.restore()
    }
    const stats = [
      { k: '总分数', v: s.totalScore, c: '#8b0000' },
      { k: '最大连击', v: `x${s.maxCombo}`, c: '#c9302c' },
      { k: '准确率', v: `${s.accuracy}%`, c: '#2e5a8b' },
      { k: '错误次数', v: s.wrongAttempts, c: s.wrongAttempts > 0 ? '#8b4513' : '#00a86b' },
      { k: '获得金币', v: `+${s.coins}`, c: '#b8860b' }
    ]
    const sy0 = cy - sh/2 + 275
    stats.forEach((st, i) => {
      const rr = Math.floor(i / 3), cc = i % 3
      const sx = cx - 210 + cc * 210, yy = sy0 + rr * 70
      ctx.font = '16px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#8b6914'; ctx.textAlign = 'center'
      ctx.fillText(st.k, sx, yy)
      ctx.font = 'bold 30px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = st.c
      ctx.fillText(String(st.v), sx, yy + 38)
    })
    if (this.level.learningCard) {
      ctx.font = '18px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#00a86b'; ctx.textAlign = 'center'
      ctx.fillText(`🎉 解锁学习卡：《${this.level.learningCard.title}》`, cx, cy + sh/2 - 115)
    }
    for (const btn of this.resultButtons) this._drawResultBtn(btn)
    ctx.restore()
  }

  _drawResultBtn(btn) {
    const ctx = this.ctx, hov = this.hoveredResultBtn === btn
    ctx.save()
    if (hov) ctx.shadowColor = 'rgba(255,215,0,0.7)'
    this._drawRoundedRect(btn.x, btn.y, btn.w, btn.h, 14)
    const g = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h)
    const c = hov ? btn.hoverColor : btn.bgColor
    g.addColorStop(0, c); g.addColorStop(1, this._adjustColor(c, -30))
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#f0e6d2'; ctx.lineWidth = 2; ctx.stroke()
    ctx.font = 'bold 24px "Ma Shan Zheng", KaiTi, serif'; ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(btn.text, btn.x + btn.w/2, btn.y + btn.h/2)
    ctx.restore()
  }

  handleMouseMove(pos) {
    const result = super.handleMouseMove(pos)
    if (result) return result
    if (this.gamePhase === 'result') {
      let found = null
      for (const btn of this.resultButtons) {
        if (pos.x >= btn.x && pos.x <= btn.x+btn.w && pos.y >= btn.y && pos.y <= btn.y+btn.h) {
          found = btn; break
        }
      }
      if (found !== this.hoveredResultBtn) {
        if (this.hoveredResultBtn && found === null) { /* noop */ }
        this.hoveredResultBtn = found
        if (found) this.services.audioManager.playSfx('button_click')
      }
      return found
    }
    return null
  }

  _drawFail() {
    const ctx = this.ctx, cx = this.width/2, cy = this.height/2
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, this.width, this.height)
    ctx.font = 'bold 56px "Ma Shan Zheng", KaiTi, serif'; ctx.textAlign = 'center'
    ctx.fillStyle = '#c9302c'; ctx.strokeStyle = '#5c0000'; ctx.lineWidth = 4
    ctx.strokeText('时 间 用 尽', cx, cy - 60); ctx.fillText('时 间 用 尽', cx, cy - 60)
    ctx.font = '24px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#f0e6d2'
    ctx.fillText('不要灰心，再来一次吧！', cx, cy)
    ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif'; ctx.fillStyle = '#d4a574'
    ctx.fillText(`当前分数：${this.services.uiState.get('score') || 0} 分`, cx, cy + 40)
    this._drawFailBtn(cx - 110, cy + 80, 220, 50, '再 试 一 次', '#00a86b', '#00c87a')
    this._drawFailBtn(cx - 110, cy + 150, 220, 50, '返 回 选 关', '#2e5a8b', '#3d72ab')
    ctx.restore()
  }

  _drawFailBtn(x, y, w, h, text, c, hc) {
    const ctx = this.ctx, hov = this._isBtnHovered(x, y, w, h)
    if (hov && !this._lastFailHov) this.services.audioManager.playSfx('button_click')
    this._lastFailHov = hov
    ctx.save()
    if (hov) ctx.shadowColor = 'rgba(255,215,0,0.7)'
    this._drawRoundedRect(x, y, w, h, 12)
    const g = ctx.createLinearGradient(x, y, x, y + h)
    const color = hov ? hc : c
    g.addColorStop(0, color); g.addColorStop(1, this._adjustColor(color, -30))
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#f0e6d2'; ctx.lineWidth = 2; ctx.stroke()
    ctx.font = 'bold 22px "Ma Shan Zheng", KaiTi, serif'; ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(text, x + w/2, y + h/2)
    ctx.restore()
  }

  _isBtnHovered(x, y, w, h) {
    const input = this.services.inputMapper
    if (!input) return false
    const p = input.mousePos || { x: -1, y: -1 }
    return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h
  }

  _renderToasts() {
    const toasts = this.services.uiState.get('toasts') || []
    const ctx = this.ctx, now = Date.now()
    toasts.forEach((t, idx) => {
      const elapsed = now - t.createdAt
      const a = elapsed < t.duration * 0.2 ? elapsed / (t.duration * 0.2) :
                elapsed > t.duration * 0.8 ? (t.duration - elapsed) / (t.duration * 0.2) : 1
      if (a <= 0) return
      const y = 180 + idx * 55
      ctx.font = '20px "ZCOOL XiaoWei", KaiTi, serif'
      const tw = ctx.measureText(t.message).width + 60
      ctx.save()
      ctx.globalAlpha = Math.max(0, a)
      this._drawRoundedRect((this.width - tw) / 2, y, tw, 45, 12)
      const colors = {
        info: 'rgba(46, 90, 139, 0.95)',
        success: 'rgba(0, 168, 107, 0.95)',
        warning: 'rgba(218, 165, 32, 0.95)',
        error: 'rgba(201, 48, 44, 0.95)'
      }
      ctx.fillStyle = colors[t.type] || colors.info; ctx.fill()
      ctx.strokeStyle = '#f0e6d2'; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = '#f0e6d2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(t.message, this.width / 2, y + 23)
      ctx.restore()
    })
  }
}