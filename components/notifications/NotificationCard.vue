<template>
  <article class="notification-card" :class="{ 'notification-card--unread': !notification.readAt }">
    <div><strong>{{ t(notification.titleKey, notification.metadata ?? {}) }}</strong><p>{{ t(notification.messageKey, notification.metadata ?? {}) }}</p><time :datetime="notification.createdAt">{{ formatPublicDate(notification.createdAt.slice(0, 10), locale) }}</time></div>
    <div class="notification-card__actions"><BaseButton v-if="!notification.readAt" size="sm" variant="ghost" @click="$emit('read')">{{ t('notifications.markRead') }}</BaseButton><BaseButton size="sm" variant="ghost" @click="$emit('archive')">{{ t('notifications.archive') }}</BaseButton></div>
  </article>
</template>

<script setup lang="ts">
import type { Notification } from '~/domains/notifications/types'
import { formatPublicDate } from '~/utils/formatters'

defineProps<{ notification: Notification }>()
defineEmits<{ read: [], archive: [] }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.notification-card { display: flex; flex-wrap: wrap; gap: $space-4; align-items: start; justify-content: space-between; padding: $space-4; border: 1px solid $color-border; border-radius: $radius-md; &--unread { border-color: $color-primary; background: $color-primary-light; } > div:first-child { display: grid; gap: $space-2; } time { font-size: $font-size-xs; color: $color-text-secondary; } &__actions { display: flex; gap: $space-2; } }
</style>
