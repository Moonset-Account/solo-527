import type { RuleConfig, CharacterUnit, PuzzleSlot, ErrorFeedback, TonePattern } from '@/types'
import { ToneChecker } from './ToneChecker'
import { ImageryMatcher } from './ImageryMatcher'

export class RuleManager {
  private config: RuleConfig
  private toneChecker: ToneChecker
  private imageryMatcher: ImageryMatcher

  constructor(config: RuleConfig) {
    this.config = config
    this.toneChecker = new ToneChecker()
    this.imageryMatcher = new ImageryMatcher()
  }

  updateConfig(config: RuleConfig): void {
    this.config = config
  }

  getActiveRules(): string[] {
    const rules: string[] = []

    if (this.config.showToneHint) {
      rules.push('声调校验：填字需符合平仄格律')
    }
    if (this.config.showImageryHint) {
      rules.push('意象校验：用字需契合诗句意象')
    }
    if (this.config.requireRhymeMatch) {
      rules.push('押韵校验：韵脚需符合词牌韵部')
    }
    if (this.config.requireAntithesis) {
      rules.push('对仗校验：对句需工整对仗')
    }
    if (this.config.allowSwapAdjacent) {
      rules.push('可交换相邻已填之字')
    }
    if (this.config.showPositionHint) {
      rules.push('可获取位置提示')
    }

    return rules
  }

  validate(
    char: CharacterUnit,
    slot: PuzzleSlot,
    context: { poemImagery: string[]; rhymeGroup?: string }
  ): ErrorFeedback[] {
    const errors: ErrorFeedback[] = []

    if (this.config.showToneHint) {
      const toneError = this.checkTone(char, slot)
      if (toneError) errors.push(toneError)
    }

    if (this.config.showImageryHint) {
      const imageryError = this.checkImagery(char, slot, context.poemImagery)
      if (imageryError) errors.push(imageryError)
    }

    if (this.config.requireRhymeMatch && slot.isRhyme) {
      const rhymeError = this.checkRhyme(char, slot, context.rhymeGroup)
      if (rhymeError) errors.push(rhymeError)
    }

    if (this.config.requireAntithesis) {
      const antithesisError = this.checkAntithesis(char, slot)
      if (antithesisError) errors.push(antithesisError)
    }

    return errors
  }

  private checkTone(char: CharacterUnit, slot: PuzzleSlot): ErrorFeedback | null {
    const expected: TonePattern = {
      tone: slot.tone,
      expected: slot.tone === 'ping' ? '平' : slot.tone === 'ze' ? '仄' : '任意',
    }
    const result = this.toneChecker.check(char, expected)
    if (!result.valid) {
      return {
        type: 'tone_mismatch',
        message: result.message,
        detail: `第${slot.index + 1}位声调不符`,
        char: char.char,
        position: slot.index,
      }
    }
    return null
  }

  private checkImagery(
    char: CharacterUnit,
    slot: PuzzleSlot,
    poemImagery: string[]
  ): ErrorFeedback | null {
    const result = this.imageryMatcher.checkImagery(char.char, slot.index, poemImagery)
    if (!result.match) {
      return {
        type: 'imagery_clash',
        message: result.message,
        detail: `第${slot.index + 1}位意象不合`,
        char: char.char,
        position: slot.index,
      }
    }
    return null
  }

  private checkRhyme(
    char: CharacterUnit,
    slot: PuzzleSlot,
    rhymeGroup?: string
  ): ErrorFeedback | null {
    if (!slot.isRhyme) return null
    if (!char.isRhyme) {
      return {
        type: 'rhyme_mismatch',
        message: '此字非韵脚字，此处需押韵',
        detail: `第${slot.index + 1}位为韵脚，需押"${rhymeGroup || ''}"韵`,
        char: char.char,
        position: slot.index,
      }
    }
    return null
  }

  private checkAntithesis(char: CharacterUnit, slot: PuzzleSlot): ErrorFeedback | null {
    if (!slot.isKeyword) return null
    if (!char.isKeyword) {
      return {
        type: 'antithesis_violation',
        message: '此字非关键词，对仗不工',
        detail: `第${slot.index + 1}位需对仗工整之字`,
        char: char.char,
        position: slot.index,
      }
    }
    return null
  }
}
