import type { DemoEntity } from '~/domains/shared/types'

export type RatingCategory
  = | 'cleaning_quality'
    | 'reliability'
    | 'communication'
    | 'punctuality'
    | 'accuracy'
    | 'fairness'
    | 'payment_experience'

export interface RatingCategoryScore {
  category: RatingCategory
  score: number
}

export interface Rating extends DemoEntity {
  jobId: string
  authorId: string
  subjectId: string
  categoryScores: RatingCategoryScore[]
  overallScore: number
  comment: string
  verifiedCompletedJob: true
  editableUntil: string
}

export type CreateRatingInput = Omit<
  Rating,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'isDemo'
  | 'verifiedCompletedJob'
  | 'editableUntil'
>

export type UpdateRatingInput = Pick<Rating, 'id' | 'categoryScores' | 'overallScore' | 'comment'>

export interface RatingSummary {
  average: number | null
  count: number
  categoryAverages: Partial<Record<RatingCategory, number>>
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}
