<template>
  <section class="notification-center">
    <header><h1>{{ t('notifications.title') }}</h1><BaseButton v-if="notifications.length" size="sm" variant="secondary" @click="$emit('read-all')">{{ t('notifications.markAllRead') }}</BaseButton></header>
    <BaseEmptyState v-if="!notifications.length" :title="t('notifications.empty')" :description="t('notifications.emptyDescription')" />
    <NotificationCard v-for="notification in notifications" :key="notification.id" :notification="notification" @read="$emit('read', notification.id)" @archive="$emit('archive', notification.id)" />
  </section>
</template>

<script setup lang="ts">
import type { Notification } from '~/domains/notifications/types'

defineProps<{ notifications: Notification[] }>()
defineEmits<{ 'read': [id: string], 'archive': [id: string], 'read-all': [] }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.notification-center { display: grid; gap: $space-4; > header { display: flex; flex-wrap: wrap; gap: $space-4; align-items: center; justify-content: space-between; } h1 { font-size: $font-size-3xl; } }
</style>
