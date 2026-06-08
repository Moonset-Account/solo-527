import { getPatternViolations, analyzeTones, checkTonePattern, getToneDescription } from '../data/pingzeDict.js'

export class ScoringSystem {
  constructor(levelConfig) {
    this.levelConfig = levelConfig
    this.baseScore = 0
    this.comboMultiplier = 1
    this.maxCombo = 0
    this.currentCombo = 0
    this.accuracy = 1
    this.hintsUsed = 0
    this.wrongAttempts = 0
    this.timeBonus = 0
  }

  calculateStars() {
    const target = this.levelConfig.scoreTarget || 100
    const ratio = this.baseScore / target
    if (ratio >= 1.2 && this.wrongAttempts === 0) return 3
    if (ratio >= 1.0) return 3
    if (ratio >= 0.8) return 2
    if (ratio >= 0.5) return 1
    return 0
  }

  calculateCoins() {
    const stars = this.calculateStars()
    const baseCoins = stars * 10
    const bonus = this.maxCombo >= 5 ? 20 : this.maxCombo >= 3 ? 10 : 0
    const perfectBonus = this.wrongAttempts === 0 ? 15 : 0
    return baseCoins + bonus + perfectBonus
  }

  addCorrectAnswer(difficulty = 1, isToneCorrect = true) {
    this.currentCombo++
    if (this.currentCombo > this.maxCombo) this.maxCombo = this.currentCombo
    this.comboMultiplier = 1 + Math.min(this.currentCombo * 0.1, 1.0)
    const basePoints = 10 * difficulty
    const toneBonus = isToneCorrect ? 5 : 0
    const comboBonus = Math.floor(basePoints * (this.comboMultiplier - 1))
    const total = Math.floor((basePoints + toneBonus + comboBonus) * this.accuracy)
    this.baseScore += total
    return { points: total, combo: this.currentCombo, comboMultiplier: this.comboMultiplier }
  }

  addWrongAnswer() {
    this.currentCombo = 0
    this.comboMultiplier = 1
    this.wrongAttempts++
    this.accuracy = Math.max(0.5, this.accuracy - 0.05)
  }

  useHint() {
    this.hintsUsed++
    this.accuracy = Math.max(0.7, this.accuracy - 0.03)
  }

  addTimeBonus(remainingSeconds) {
    this.timeBonus = Math.floor(remainingSeconds * 0.5)
    this.baseScore += this.timeBonus
    return this.timeBonus
  }

  getTotalScore() {
    return this.baseScore
  }

  getGrade() {
    const score = this.getTotalScore()
    const target = this.levelConfig.scoreTarget || 100
    const ratio = score / target
    if (ratio >= 1.3) return { grade: 'S', color: '#ffd700', label: '诗仙' }
    if (ratio >= 1.1) return { grade: 'A', color: '#c9302c', label: '诗圣' }
    if (ratio >= 0.9) return { grade: 'B', color: '#2e5a8b', label: '诗人' }
    if (ratio >= 0.7) return { grade: 'C', color: '#00a86b', label: '学子' }
    return { grade: 'D', color: '#888', label: '初学' }
  }

  getSummary() {
    return {
      totalScore: this.getTotalScore(),
      stars: this.calculateStars(),
      coins: this.calculateCoins(),
      grade: this.getGrade(),
      maxCombo: this.maxCombo,
      wrongAttempts: this.wrongAttempts,
      hintsUsed: this.hintsUsed,
      timeBonus: this.timeBonus,
      accuracy: Math.round(this.accuracy * 100)
    }
  }
}

export class PuzzleValidator {
  constructor(levelConfig) {
    this.levelConfig = levelConfig
  }

  validateFill(lineIndex, blankIndex, char) {
    const puzzle = this.levelConfig.puzzle
    const line = puzzle.lines[lineIndex]
    if (!line) return { valid: false, reason: '诗句不存在' }

    const correctChar = line.text[line.blanks[blankIndex]]
    const expectedTone = line.pattern[line.blanks[blankIndex]]
    const actualTone = analyzeTones(char)[0]?.tone || '中'

    const result = {
      valid: char === correctChar,
      correctChar,
      expectedTone,
      actualTone,
      reasons: []
    }

    if (result.valid) {
      if (expectedTone !== '中' && expectedTone !== actualTone) {
        result.toneWarning = true
        result.reasons.push(`平仄基本正确，但「${char}」实际为${getToneDescription(actualTone)}，预期为${getToneDescription(expectedTone)}`)
      }
    } else {
      result.reasons = this._explainWrongAnswer(char, correctChar, expectedTone, actualTone)
    }

    return result
  }

  validateReorder(lineIndex, orderedChars) {
    const puzzle = this.levelConfig.puzzle
    const allLines = [...(puzzle.lines || []), ...(puzzle.reorderLines || [])]
    const reorderLines = puzzle.lines?.filter(l => l.shuffled) || []
    const linesWithReorder = puzzle.lines ? puzzle.lines.filter(l => l.shuffled) : []
    const extraReorder = puzzle.reorderLines || []
    const targetLine = (linesWithReorder[lineIndex]) || extraReorder[lineIndex] || (reorderLines[lineIndex])
    
    if (!targetLine) return { valid: false, reason: '诗句不存在' }

    const correctText = targetLine.text
    const userText = orderedChars.join('')
    const correct = userText === correctText

    const result = {
      valid: correct,
      correctText,
      userText,
      reasons: []
    }

    if (!correct) {
      const toneViolations = getPatternViolations(userText, targetLine.pattern)
      if (toneViolations.length > 0) {
        result.reasons.push(`平仄不匹配：发现 ${toneViolations.length} 处平仄错误`)
        toneViolations.slice(0, 2).forEach(v => {
          result.reasons.push(`  第${v.position + 1}字「${v.char}」：应为${getToneDescription(v.expected)}，实为${getToneDescription(v.actual)}`)
        })
      }
      const wrongPositions = []
      for (let i = 0; i < Math.min(orderedChars.length, correctText.length); i++) {
        if (orderedChars[i] !== correctText[i]) {
          wrongPositions.push(i + 1)
        }
      }
      if (wrongPositions.length > 0) {
        result.reasons.push(`位置错误：第 ${wrongPositions.join('、')} 字顺序不对`)
      }
      result.reasons.push(`正确答案：${correctText}`)
    }

    return result
  }

  validateChoice(lineIndex, choiceIndex) {
    const puzzle = this.levelConfig.puzzle
    const line = puzzle.lines[lineIndex]
    if (!line) return { valid: false, reason: '题目不存在' }

    const isCorrect = choiceIndex === line.correct
    const correctChoice = line.choices[line.correct]
    const userChoice = line.choices[choiceIndex]

    const result = {
      valid: isCorrect,
      correctChoice,
      userChoice,
      reasons: []
    }

    if (!isCorrect) {
      result.reasons.push(`「${userChoice}」不合适，正确答案是「${correctChoice}」`)
      const correctTone = analyzeTones(correctChoice)[0]?.tone
      if (correctTone) {
        result.reasons.push(`从平仄看，「${correctChoice}」为${getToneDescription(correctTone)}声，更符合格律要求`)
      }
    }

    return result
  }

  checkImagery(text) {
    const imageries = this.levelConfig.imageries || []
    const found = []
    const missing = []

    imageries.forEach(img => {
      if (text.includes(img)) {
        found.push(img)
      } else {
        missing.push(img)
      }
    })

    return {
      found,
      missing,
      ratio: imageries.length > 0 ? found.length / imageries.length : 1,
      completeness: found.length === imageries.length
    }
  }

  _explainWrongAnswer(userChar, correctChar, expectedTone, actualTone) {
    const reasons = []
    reasons.push(`「${userChar}」不对，正确字是「${correctChar}」`)

    if (expectedTone !== '中') {
      const correctTone = analyzeTones(correctChar)[0]?.tone
      if (correctTone && correctTone !== actualTone) {
        reasons.push(`平仄角度：「${correctChar}」是${getToneDescription(correctTone)}，符合此位置${getToneDescription(expectedTone)}的要求`)
        reasons.push(`而「${userChar}」是${getToneDescription(actualTone)}，不符合格律`)
      }
    }

    return reasons
  }
}
