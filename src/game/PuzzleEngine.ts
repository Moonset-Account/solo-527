import type {
  PoemLine,
  PuzzleSlot,
  PuzzleChar,
  ErrorFeedback,
  HintResult,
  GameCanvasState,
  AnimationState,
} from '@/types'
import { ToneChecker } from './ToneChecker'
import { ImageryMatcher } from './ImageryMatcher'
import { HintSystem } from './HintSystem'

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export class PuzzleEngine {
  private poemLine: PoemLine
  private poemImagery: string[]
  private currentSlots: PuzzleSlot[]
  private currentChars: PuzzleChar[]
  private errorsCount: number
  private hintsUsed: number
  private startTime: number
  private toneChecker: ToneChecker
  private imageryMatcher: ImageryMatcher
  private hintSystem: HintSystem

  constructor(poemLine: PoemLine, poemImagery: string[] = [], hintPoints: number = 5) {
    this.poemLine = poemLine
    this.poemImagery = poemImagery
    this.currentSlots = []
    this.currentChars = []
    this.errorsCount = 0
    this.hintsUsed = 0
    this.startTime = Date.now()
    this.toneChecker = new ToneChecker()
    this.imageryMatcher = new ImageryMatcher()
    this.hintSystem = new HintSystem(hintPoints)
    this.initializePuzzle()
  }

  private initializePuzzle(): void {
    this.currentSlots = this.poemLine.characters.map((cu, index) => ({
      index,
      expectedChar: cu.char,
      placedChar: null,
      tone: this.poemLine.tonePattern[index]?.tone ?? cu.tone,
      isRhyme: cu.isRhyme,
      isKeyword: cu.isKeyword,
      imagery: cu.imagery,
    }))

    const shuffled = shuffleArray(
      this.poemLine.characters.map((cu, index) => ({
        id: `char-${index}`,
        char: cu.char,
        tone: cu.tone,
        isRhyme: cu.isRhyme,
        isKeyword: cu.isKeyword,
        imagery: cu.imagery,
        slotIndex: null,
        originIndex: index,
      }))
    )

    this.currentChars = shuffled
    this.errorsCount = 0
    this.hintsUsed = 0
    this.startTime = Date.now()
  }

  getSlots(): PuzzleSlot[] {
    return this.currentSlots
  }

  getChars(): PuzzleChar[] {
    return this.currentChars
  }

  getErrorsCount(): number {
    return this.errorsCount
  }

  getHintsUsed(): number {
    return this.hintsUsed
  }

  getStartTime(): number {
    return this.startTime
  }

  placeChar(charId: string, slotIndex: number): boolean {
    const char = this.currentChars.find((c) => c.id === charId)
    if (!char) return false
    if (slotIndex < 0 || slotIndex >= this.currentSlots.length) return false
    if (char.slotIndex !== null) return false
    if (this.currentSlots[slotIndex].placedChar !== null) return false

    char.slotIndex = slotIndex
    this.currentSlots[slotIndex].placedChar = char.char
    return true
  }

  removeChar(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.currentSlots.length) return false
    const slot = this.currentSlots[slotIndex]
    if (slot.placedChar === null) return false

    const char = this.currentChars.find(
      (c) => c.slotIndex === slotIndex
    )
    if (char) {
      char.slotIndex = null
    }
    slot.placedChar = null
    return true
  }

  swapChars(slotA: number, slotB: number): boolean {
    if (slotA < 0 || slotA >= this.currentSlots.length) return false
    if (slotB < 0 || slotB >= this.currentSlots.length) return false
    if (slotA === slotB) return false

    const slotAData = this.currentSlots[slotA]
    const slotBData = this.currentSlots[slotB]

    if (slotAData.placedChar === null || slotBData.placedChar === null) return false

    const charA = this.currentChars.find((c) => c.slotIndex === slotA)
    const charB = this.currentChars.find((c) => c.slotIndex === slotB)

    if (!charA || !charB) return false

    charA.slotIndex = slotB
    charB.slotIndex = slotA
    slotAData.placedChar = charB.char
    slotBData.placedChar = charA.char

    return true
  }

  checkPlacement(slotIndex: number): ErrorFeedback | null {
    if (slotIndex < 0 || slotIndex >= this.currentSlots.length) return null
    const slot = this.currentSlots[slotIndex]
    if (slot.placedChar === null) return null

    const char = this.currentChars.find((c) => c.slotIndex === slotIndex)
    if (!char) return null

    const errors: ErrorFeedback[] = []

    const toneResult = this.toneChecker.check(char, {
      tone: slot.tone,
      expected: slot.tone === 'ping' ? '平' : slot.tone === 'ze' ? '仄' : '任意',
    })
    if (!toneResult.valid) {
      errors.push({
        type: 'tone_mismatch',
        message: toneResult.message,
        detail: `第${slotIndex + 1}位声调不符`,
        char: char.char,
        position: slotIndex,
      })
    }

    const imageryResult = this.imageryMatcher.checkImagery(
      char.char,
      slotIndex,
      this.poemImagery
    )
    if (!imageryResult.match) {
      errors.push({
        type: 'imagery_clash',
        message: imageryResult.message,
        detail: `第${slotIndex + 1}位意象不合`,
        char: char.char,
        position: slotIndex,
      })
    }

    if (errors.length > 0) {
      this.errorsCount++
      return errors[0]
    }

    if (char.char !== slot.expectedChar) {
      this.errorsCount++
      return {
        type: 'wrong_position',
        message: '此字位置不正确',
        detail: `第${slotIndex + 1}位非正确之字`,
        char: char.char,
        position: slotIndex,
      }
    }

    return null
  }

  checkComplete(): boolean {
    return this.currentSlots.every(
      (slot) => slot.placedChar === slot.expectedChar
    )
  }

  getHint(type: 'tone' | 'imagery' | 'position'): HintResult {
    const firstEmptySlot = this.currentSlots.find((s) => s.placedChar === null)
    const targetSlot = firstEmptySlot ?? this.currentSlots[0]
    if (!targetSlot) {
      return { type, message: '无可用提示', detail: '', cost: 0 }
    }

    let result: HintResult

    switch (type) {
      case 'tone':
        result = this.hintSystem.getToneHint(targetSlot)
        break
      case 'imagery':
        result = this.hintSystem.getImageryHint(targetSlot, this.poemImagery)
        break
      case 'position':
        result = this.hintSystem.getPositionHint(targetSlot, targetSlot.expectedChar)
        break
    }

    const used = this.hintSystem.useHint(type)
    if (used) {
      this.hintsUsed++
    } else {
      return {
        type,
        message: '提示点数不足',
        detail: `需要${result.cost}点，当前${this.hintSystem.getRemainingPoints()}点`,
        cost: result.cost,
      }
    }

    return result
  }

  getState(): GameCanvasState {
    return {
      slots: [...this.currentSlots],
      chars: [...this.currentChars],
      dragging: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
      mouseX: 0,
      mouseY: 0,
      animations: [],
    }
  }

  reset(): void {
    this.initializePuzzle()
  }
}
