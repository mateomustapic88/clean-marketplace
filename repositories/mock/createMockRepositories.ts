import type { RepositoryRegistry } from '~/repositories'
import { MockAuthRepository } from '~/repositories/mock/MockAuthRepository'
import { MockFeedbackRepository } from '~/repositories/mock/MockFeedbackRepository'
import { MockDatabase } from '~/repositories/mock/MockDatabase'
import { MockJobRepository } from '~/repositories/mock/MockJobRepository'
import { MockNotificationRepository } from '~/repositories/mock/MockNotificationRepository'
import { MockOfferRepository } from '~/repositories/mock/MockOfferRepository'
import { MockRatingRepository } from '~/repositories/mock/MockRatingRepository'
import { MockSubscriptionRepository } from '~/repositories/mock/MockSubscriptionRepository'
import { MockUserRepository } from '~/repositories/mock/MockUserRepository'

export const createMockRepositories = (): RepositoryRegistry => {
  const database = new MockDatabase()

  return {
    auth: new MockAuthRepository(database),
    feedback: new MockFeedbackRepository(),
    users: new MockUserRepository(database),
    jobs: new MockJobRepository(database),
    offers: new MockOfferRepository(database),
    ratings: new MockRatingRepository(database),
    subscriptions: new MockSubscriptionRepository(database),
    notifications: new MockNotificationRepository(database),
  }
}
