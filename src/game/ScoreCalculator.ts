import type { ScoreResult } from '@/types'

export class ScoreCalculator {
  calculate(params: {
    baseScore: number
    timeUsed: number
    timeLimit: number
    hintsUsed: number
    errorsCount: number
    difficulty: number
    multiplier: number
  }): ScoreResult {
    const baseScore = params.difficulty * 1000
    const timeBonus = Math.max(0, (params.timeLimit - params.timeUsed) / params.timeLimit * 500)
    const hintPenalty = params.hintsUsed * 100
    const errorPenalty = params.errorsCount * 150
    const rawTotal = (baseScore + timeBonus - hintPenalty - errorPenalty) * params.multiplier
    const totalScore = Math.max(0, Math.round(rawTotal))

    const stars = this.calculateStars(totalScore, baseScore)

    return {
      baseScore,
      timeBonus: Math.round(timeBonus),
      hintPenalty,
      errorPenalty,
      totalScore,
      stars,
    }
  }

  private calculateStars(totalScore: number, baseScore: number): number {
    if (totalScore >= baseScore * 1.5) return 3
    if (totalScore >= baseScore * 0.8) return 2
    if (totalScore > 0) return 1
    return 0
  }
}
