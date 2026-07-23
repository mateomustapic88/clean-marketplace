import type { DemoEntity } from '~/domains/shared/types'

export type NotificationType
  = | 'job_published'
    | 'new_offer'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'offer_withdrawn'
    | 'job_updated'
    | 'job_cancelled'
    | 'job_completed'
    | 'new_review'
    | 'trial_ending'
    | 'trial_expired'
    | 'subscription_activated'
    | 'subscription_payment_issue'
    | 'subscription_renewal'
    | 'upcoming_cleaning'

export interface Notification extends DemoEntity {
  userId: string
  type: NotificationType
  titleKey: string
  messageKey: string
  resourceId: string | null
  readAt: string | null
  archivedAt: string | null
  metadata?: Record<string, string | number>
}
