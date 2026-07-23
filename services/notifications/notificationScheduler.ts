import type { CleaningJob } from '~/domains/jobs/types'
import type { Notification } from '~/domains/notifications/types'
import type { Subscription } from '~/domains/subscriptions/types'
import { createNotification } from '~/services/notifications/notificationFactory'

const inWindow = (date: string | null, now: Date, days: number): boolean => {
  if (!date) return false
  const difference = new Date(date).getTime() - now.getTime()
  return difference > 0 && difference <= days * 86_400_000
}

export const buildScheduledNotifications = (
  subscriptions: Subscription[],
  jobs: CleaningJob[],
  now = new Date(),
): Notification[] => {
  const notifications: Notification[] = []
  for (const subscription of subscriptions) {
    if (subscription.status === 'trial' && inWindow(subscription.trialEndsAt, now, 2)) {
      notifications.push(createNotification(
        subscription.userId,
        'trial_ending',
        subscription.id,
      ))
    }
    if (subscription.status === 'active' && inWindow(subscription.currentPeriodEndsAt, now, 3)) {
      notifications.push(createNotification(
        subscription.userId,
        'subscription_renewal',
        subscription.id,
      ))
    }
  }
  for (const job of jobs) {
    if (!job.assignedCleanerId || !['assigned', 'cleaner_confirmed'].includes(job.status)) continue
    if (!inWindow(job.preferredDate, now, 1)) continue
    notifications.push(createNotification(job.ownerId, 'upcoming_cleaning', job.id))
    notifications.push(createNotification(job.assignedCleanerId, 'upcoming_cleaning', job.id))
  }
  return notifications
}
