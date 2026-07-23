import { defineStore } from 'pinia'
import type { Notification } from '~/domains/notifications/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)
  const unreadCount = computed(
    () => notifications.value.filter((notification) => !notification.readAt).length,
  )

  const repositories = () => useNuxtApp().$repositories

  const loadForUser = async (userId: string) => {
    isLoading.value = true
    try {
      notifications.value = await repositories().notifications.listByUser(userId)
    }
    finally {
      isLoading.value = false
    }
  }

  const markAsRead = async (id: string, userId: string) => {
    const notification = await repositories().notifications.markAsRead(id, userId)
    const index = notifications.value.findIndex((item) => item.id === id)
    if (index >= 0) notifications.value[index] = notification
  }

  const markAllAsRead = async (userId: string) => {
    notifications.value = await repositories().notifications.markAllAsRead(userId)
  }

  const archive = async (id: string, userId: string) => {
    await repositories().notifications.archive(id, userId)
    notifications.value = notifications.value.filter((item) => item.id !== id)
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    loadForUser,
    markAsRead,
    markAllAsRead,
    archive,
  }
})
