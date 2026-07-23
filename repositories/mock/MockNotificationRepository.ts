import { DomainError } from '~/domains/shared/errors'
import type { Notification, NotificationType } from '~/domains/notifications/types'
import type { NotificationRepository } from '~/repositories/notifications/NotificationRepository'
import type { MockDatabase } from '~/repositories/mock/MockDatabase'
import { clone, nowIso } from '~/repositories/mock/helpers'
import { createNotification } from '~/services/notifications/notificationFactory'

export class MockNotificationRepository implements NotificationRepository {
  constructor(private readonly database: MockDatabase) {}

  async listByUser(userId: string): Promise<Notification[]> {
    return clone(
      this.database.read().notifications
        .filter((notification) => notification.userId === userId)
        .filter((notification) => !notification.archivedAt)
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
    )
  }

  async create(
    userId: string,
    type: NotificationType,
    resourceId: string | null,
    metadata?: Record<string, string | number>,
  ): Promise<Notification> {
    return this.database.transaction((snapshot) => {
      const notification = createNotification(userId, type, resourceId, metadata)
      snapshot.notifications.push(notification)
      return notification
    })
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.database.transaction((snapshot) => {
      const notification = snapshot.notifications.find(
        (item) => item.id === id && item.userId === userId,
      )
      if (!notification) {
        throw new DomainError('notification_not_found')
      }

      notification.readAt ??= nowIso()
      notification.updatedAt = nowIso()
      return notification
    })
  }

  async markAllAsRead(userId: string): Promise<Notification[]> {
    return this.database.transaction((snapshot) => {
      const timestamp = nowIso()
      const notifications = snapshot.notifications.filter(
        (notification) => notification.userId === userId,
      )
      notifications.forEach((notification) => {
        notification.readAt ??= timestamp
        notification.updatedAt = timestamp
      })
      return notifications
    })
  }

  async archive(id: string, userId: string): Promise<Notification> {
    return this.database.transaction((snapshot) => {
      const notification = snapshot.notifications.find((item) => item.id === id && item.userId === userId)
      if (!notification) throw new DomainError('notification_not_found')
      notification.archivedAt = nowIso()
      notification.updatedAt = notification.archivedAt
      return notification
    })
  }
}
