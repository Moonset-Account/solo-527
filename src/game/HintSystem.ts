import type { PuzzleSlot, HintResult } from '@/types'
import { ToneChecker } from './ToneChecker'
import { ImageryMatcher } from './ImageryMatcher'

const HINT_COSTS: Record<string, number> = {
  tone: 1,
  imagery: 2,
  position: 3,
}

export class HintSystem {
  private hintPoints: number
  private toneChecker: ToneChecker
  private imageryMatcher: ImageryMatcher

  constructor(initialPoints: number) {
    this.hintPoints = initialPoints
    this.toneChecker = new ToneChecker()
    this.imageryMatcher = new ImageryMatcher()
  }

  getToneHint(slot: PuzzleSlot): HintResult {
    const toneName = slot.tone === 'ping' ? '平声' : slot.tone === 'ze' ? '仄声' : '任意声调'
    return {
      type: 'tone',
      message: `此位宜填${toneName}字`,
      detail: `第${slot.index + 1}字应为${toneName}`,
      cost: HINT_COSTS.tone,
    }
  }

  getImageryHint(slot: PuzzleSlot, poemImagery: string[]): HintResult {
    const slotImagery = slot.imagery ? [slot.imagery] : []
    const relevantImagery = poemImagery.length > 0 ? poemImagery : slotImagery

    if (relevantImagery.length === 0) {
      return {
        type: 'imagery',
        message: '此句意象不限',
        detail: '此位无特定意象要求',
        cost: HINT_COSTS.imagery,
      }
    }

    const imageryStr = relevantImagery.join('、')
    return {
      type: 'imagery',
      message: `此句意象为：${imageryStr}`,
      detail: `第${slot.index + 1}字应契合'${imageryStr}'之意象`,
      cost: HINT_COSTS.imagery,
    }
  }

  getPositionHint(slot: PuzzleSlot, correctChar: string): HintResult {
    if (!correctChar || correctChar.length === 0) {
      return {
        type: 'position',
        message: '无法提供位置提示',
        detail: '',
        cost: HINT_COSTS.position,
      }
    }

    const partial = correctChar[0]
    return {
      type: 'position',
      message: `此位首笔提示：${partial}`,
      detail: `第${slot.index + 1}字首部为"${partial}"`,
      cost: HINT_COSTS.position,
    }
  }

  useHint(type: string): HintResult | null {
    const cost = HINT_COSTS[type]
    if (cost === undefined) {
      return null
    }

    if (this.hintPoints < cost) {
      return null
    }

    this.hintPoints -= cost

    if (type === 'tone') {
      return {
        type: 'tone',
        message: '声调提示已使用',
        detail: `消耗${cost}点提示点数`,
        cost,
      }
    }

    if (type === 'imagery') {
      return {
        type: 'imagery',
        message: '意象提示已使用',
        detail: `消耗${cost}点提示点数`,
        cost,
      }
    }

    if (type === 'position') {
      return {
        type: 'position',
        message: '位置提示已使用',
        detail: `消耗${cost}点提示点数`,
        cost,
      }
    }

    return null
  }

  getRemainingPoints(): number {
    return this.hintPoints
  }
}
