import type {
  CreateRatingInput,
  Rating,
  RatingSummary,
  UpdateRatingInput,
} from '~/domains/ratings/types'

export interface RatingRepository {
  listByUser(userId: string): Promise<Rating[]>
  listByJob(jobId: string): Promise<Rating[]>
  getById(id: string): Promise<Rating | null>
  create(input: CreateRatingInput): Promise<Rating>
  update(input: UpdateRatingInput, authorId: string): Promise<Rating>
  summaryForUser(userId: string): Promise<RatingSummary>
}
