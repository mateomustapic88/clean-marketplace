import type { Rating, RatingCategory, RatingSummary } from '~/domains/ratings/types'

export const buildRatingSummary = (ratings: Rating[]): RatingSummary => {
  const categoryScores = new Map<RatingCategory, number[]>()
  for (const rating of ratings) {
    for (const item of rating.categoryScores) {
      categoryScores.set(item.category, [...(categoryScores.get(item.category) ?? []), item.score])
    }
  }
  const categoryAverages: Partial<Record<RatingCategory, number>> = {}
  for (const [category, scores] of categoryScores) {
    categoryAverages[category] = Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1))
  }
  const distribution: RatingSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.forEach((rating) => distribution[Math.round(rating.overallScore) as keyof typeof distribution]++)
  return {
    average: ratings.length
      ? Number((ratings.reduce((total, rating) => total + rating.overallScore, 0) / ratings.length).toFixed(1))
      : null,
    count: ratings.length,
    categoryAverages,
    distribution,
  }
}
