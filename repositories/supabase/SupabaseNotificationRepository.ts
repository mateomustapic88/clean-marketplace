import type { SupabaseClient } from '@supabase/supabase-js'
import type { Notification, NotificationType } from '~/domains/notifications/types'
import type { NotificationRepository } from '~/repositories/notifications/NotificationRepository'
import { throwIfSupabaseError } from './helpers'
import { mapNotification } from './mappers'
import type { DbRow } from './mappers'

export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly client: SupabaseClient) {}
  async listByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await this.client.from('notifications').select('*').eq('user_id', userId).is('archived_at', null).order('created_at', { ascending: false })
    throwIfSupabaseError(error)
    return (data as DbRow[]).map(mapNotification)
  }

  async create(_userId: string, _type: NotificationType, _resourceId: string | null, _metadata?: Record<string, string | number>): Promise<Notification> {
    throw new Error('Notifications are created only by trusted server operations')
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.update(id, userId, { read_at: new Date().toISOString() })
  }

  async markAllAsRead(userId: string): Promise<Notification[]> {
    const { error } = await this.client.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)
    throwIfSupabaseError(error)
    return this.listByUser(userId)
  }

  async archive(id: string, userId: string): Promise<Notification> {
    return this.update(id, userId, { archived_at: new Date().toISOString() })
  }

  private async update(id: string, userId: string, changes: object) {
    const { data, error } = await this.client.from('notifications').update(changes).eq('id', id).eq('user_id', userId).select('*').single()
    throwIfSupabaseError(error)
    return mapNotification(data as DbRow)
  }
}
