import type { SupabaseClient } from '@supabase/supabase-js'
import type { RepositoryRegistry } from '~/repositories'
import { SupabaseAuthRepository } from './SupabaseAuthRepository'
import { SupabaseFeedbackRepository } from './SupabaseFeedbackRepository'
import { SupabaseJobRepository } from './SupabaseJobRepository'
import { SupabaseNotificationRepository } from './SupabaseNotificationRepository'
import { SupabaseOfferRepository } from './SupabaseOfferRepository'
import { SupabaseRatingRepository } from './SupabaseRatingRepository'
import { SupabaseSubscriptionRepository } from './SupabaseSubscriptionRepository'
import { SupabaseUserRepository } from './SupabaseUserRepository'

export const createSupabaseRepositories = (
  client: SupabaseClient,
  appBaseUrl: string,
): RepositoryRegistry => ({
  auth: new SupabaseAuthRepository(client, appBaseUrl),
  feedback: new SupabaseFeedbackRepository(client),
  users: new SupabaseUserRepository(client),
  jobs: new SupabaseJobRepository(client),
  offers: new SupabaseOfferRepository(client),
  ratings: new SupabaseRatingRepository(client),
  subscriptions: new SupabaseSubscriptionRepository(client),
  notifications: new SupabaseNotificationRepository(client),
})
