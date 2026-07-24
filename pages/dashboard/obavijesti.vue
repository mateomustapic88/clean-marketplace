<template>
  <NotificationCenter :notifications="store.notifications" @read="read" @archive="archive" @read-all="readAll" />
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useNotificationsStore } from '~/stores/notifications'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/obavijesti', en: '/dashboard/notifications', sl: '/nadzorna-plosca/obvestila' } })
const auth = useAuthStore()
const store = useNotificationsStore()
const load = async () => {
  if (auth.user)
    await store.loadForUser(auth.user.id)
}
watch(() => auth.user?.id, load, { immediate: true })
const read = async (id: string) => {
  if (auth.user)
    await store.markAsRead(id, auth.user.id)
}
const archive = async (id: string) => {
  if (auth.user)
    await store.archive(id, auth.user.id)
}
const readAll = async () => {
  if (auth.user)
    await store.markAllAsRead(auth.user.id)
}
</script>
