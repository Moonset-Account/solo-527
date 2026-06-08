export const SCORING_CONFIG = {
  busWaitWeight: 3,
  scoreSmoothingFactor: 0.1,
  starThresholds: {
    threeStar: 0.6,
    twoStar: 0.8,
    oneStar: 1.0,
  },
} as const;

export function calculateStarRating(congestionScore: number, targetScore: number): 0 | 1 | 2 | 3 {
  if (congestionScore > targetScore * SCORING_CONFIG.starThresholds.oneStar) return 0;
  if (congestionScore <= targetScore * SCORING_CONFIG.starThresholds.threeStar) return 3;
  if (congestionScore <= targetScore * SCORING_CONFIG.starThresholds.twoStar) return 2;
  return 1;
}

export function smoothScore(currentSmoothed: number, rawScore: number): number {
  const alpha = SCORING_CONFIG.scoreSmoothingFactor;
  return currentSmoothed * (1 - alpha) + rawScore * alpha;
}
