import { DomainError } from '~/domains/shared/errors'
import type {
  CreateRatingInput,
  Rating,
  RatingSummary,
  UpdateRatingInput,
} from '~/domains/ratings/types'
import type { RatingRepository } from '~/repositories/ratings/RatingRepository'
import type { MockDatabase, MockDatabaseSnapshot } from '~/repositories/mock/MockDatabase'
import { clone, createId, nowIso } from '~/repositories/mock/helpers'
import { createNotification } from '~/services/notifications/notificationFactory'
import { buildRatingSummary } from '~/services/ratings/ratingSummary'
import { saasConfig } from '~/config/saas'

export class MockRatingRepository implements RatingRepository {
  constructor(private readonly database: MockDatabase) {}

  async listByUser(userId: string): Promise<Rating[]> {
    return clone(
      this.database.read().ratings.filter(
        (rating) => rating.authorId === userId || rating.subjectId === userId,
      ),
    )
  }

  async listByJob(jobId: string): Promise<Rating[]> {
    return clone(this.database.read().ratings.filter((rating) => rating.jobId === jobId))
  }

  async getById(id: string): Promise<Rating | null> {
    return clone(this.database.read().ratings.find((rating) => rating.id === id) ?? null)
  }

  async create(input: CreateRatingInput): Promise<Rating> {
    return this.database.transaction((snapshot) => {
      const job = snapshot.jobs.find((item) => item.id === input.jobId)
      if (
        !job
        || job.status !== 'completed'
        || !job.acceptedOfferId
        || !job.assignedCleanerId
      ) {
        throw new DomainError('rating_not_allowed')
      }

      const participants = [job.ownerId, job.assignedCleanerId]
      if (
        !participants.includes(input.authorId)
        || !participants.includes(input.subjectId)
        || input.authorId === input.subjectId
      ) {
        throw new DomainError('rating_not_allowed')
      }

      const duplicateRating = snapshot.ratings.some(
        (rating) => rating.jobId === input.jobId
          && rating.authorId === input.authorId,
      )
      if (duplicateRating) {
        throw new DomainError('rating_already_exists')
      }

      const scores = [
        input.overallScore,
        ...input.categoryScores.map((category) => category.score),
      ]
      if (scores.some((score) => score < 1 || score > 5)) {
        throw new DomainError('rating_score_invalid')
      }

      const timestamp = nowIso()
      const editableUntil = new Date(timestamp)
      editableUntil.setUTCDate(editableUntil.getUTCDate() + saasConfig.reviewEditDays)
      const rating: Rating = {
        ...clone(input),
        id: createId('rating'),
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        verifiedCompletedJob: true,
        editableUntil: editableUntil.toISOString(),
      }
      snapshot.ratings.push(rating)

      const subjectRatings = snapshot.ratings.filter(
        (item) => item.subjectId === input.subjectId,
      )
      const averageRating = subjectRatings.reduce(
        (total, item) => total + item.overallScore,
        0,
      ) / subjectRatings.length
      const subjectProfile = snapshot.owners.find(
        (profile) => profile.userId === input.subjectId,
      ) ?? snapshot.cleaners.find(
        (profile) => profile.userId === input.subjectId,
      )
      if (subjectProfile) {
        subjectProfile.averageRating = Number(averageRating.toFixed(1))
        subjectProfile.ratingCount = subjectRatings.length
        subjectProfile.updatedAt = timestamp
      }

      snapshot.notifications.push(createNotification(input.subjectId, 'new_review', job.id))

      return rating
    })
  }

  async update(input: UpdateRatingInput, authorId: string): Promise<Rating> {
    return this.database.transaction((snapshot) => {
      const rating = snapshot.ratings.find((item) => item.id === input.id && item.authorId === authorId)
      if (!rating) throw new DomainError('rating_not_found')
      if (new Date(rating.editableUntil) <= new Date()) throw new DomainError('rating_edit_window_closed')
      const scores = [input.overallScore, ...input.categoryScores.map((item) => item.score)]
      if (scores.some((score) => score < 1 || score > 5)) throw new DomainError('rating_score_invalid')
      rating.overallScore = input.overallScore
      rating.categoryScores = clone(input.categoryScores)
      rating.comment = input.comment
      rating.updatedAt = nowIso()
      this.refreshProfile(snapshot, rating.subjectId)
      return rating
    })
  }

  async summaryForUser(userId: string): Promise<RatingSummary> {
    return buildRatingSummary(this.database.read().ratings.filter((rating) => rating.subjectId === userId))
  }

  private refreshProfile(snapshot: MockDatabaseSnapshot, subjectId: string): void {
    const summary = buildRatingSummary(snapshot.ratings.filter((rating) => rating.subjectId === subjectId))
    const profile = snapshot.owners.find((item) => item.userId === subjectId)
      ?? snapshot.cleaners.find((item) => item.userId === subjectId)
    if (profile) {
      profile.averageRating = summary.average
      profile.ratingCount = summary.count
      profile.updatedAt = nowIso()
    }
  }
}
