import type { Notification, NotificationType } from '~/domains/notifications/types'
import { createId, nowIso } from '~/repositories/mock/helpers'

export const createNotification = (
  userId: string,
  type: NotificationType,
  resourceId: string | null,
  metadata?: Record<string, string | number>,
): Notification => {
  const timestamp = nowIso()
  const translationKey = type.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
  return {
    id: createId('notification'),
    isDemo: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    userId,
    type,
    titleKey: `notifications.types.${translationKey}.title`,
    messageKey: `notifications.types.${translationKey}.message`,
    resourceId,
    readAt: null,
    archivedAt: null,
    ...(metadata ? { metadata } : {}),
  }
}
