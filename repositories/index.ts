import type { AuthRepository } from '~/repositories/auth/AuthRepository'
import type { FeedbackRepository } from '~/repositories/feedback/FeedbackRepository'
import type { JobRepository } from '~/repositories/jobs/JobRepository'
import type { NotificationRepository } from '~/repositories/notifications/NotificationRepository'
import type { OfferRepository } from '~/repositories/offers/OfferRepository'
import type { RatingRepository } from '~/repositories/ratings/RatingRepository'
import type { SubscriptionRepository } from '~/repositories/subscriptions/SubscriptionRepository'
import type { UserRepository } from '~/repositories/users/UserRepository'

export interface RepositoryRegistry {
  auth: AuthRepository
  feedback: FeedbackRepository
  users: UserRepository
  jobs: JobRepository
  offers: OfferRepository
  ratings: RatingRepository
  subscriptions: SubscriptionRepository
  notifications: NotificationRepository
}

export type { AuthRepository } from '~/repositories/auth/AuthRepository'
export type { FeedbackRepository } from '~/repositories/feedback/FeedbackRepository'
export type { JobRepository } from '~/repositories/jobs/JobRepository'
export type { NotificationRepository } from '~/repositories/notifications/NotificationRepository'
export type { OfferRepository } from '~/repositories/offers/OfferRepository'
export type { RatingRepository } from '~/repositories/ratings/RatingRepository'
export type { SubscriptionRepository } from '~/repositories/subscriptions/SubscriptionRepository'
export type { UserRepository } from '~/repositories/users/UserRepository'
