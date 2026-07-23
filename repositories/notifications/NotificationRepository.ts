import type { Notification, NotificationType } from '~/domains/notifications/types'

export interface NotificationRepository {
  listByUser(userId: string): Promise<Notification[]>
  create(userId: string, type: NotificationType, resourceId: string | null, metadata?: Record<string, string | number>): Promise<Notification>
  markAsRead(id: string, userId: string): Promise<Notification>
  markAllAsRead(userId: string): Promise<Notification[]>
  archive(id: string, userId: string): Promise<Notification>
}
