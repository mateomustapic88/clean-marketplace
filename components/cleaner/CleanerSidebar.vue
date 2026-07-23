<template>
  <nav class="cleaner-sidebar" :aria-label="t('cleaner.navigation.label')">
    <AppLogo />
    <div class="cleaner-sidebar__links">
      <NuxtLink v-for="item in items" :key="item.to" :to="item.to" @click="$emit('navigate')">
        <component :is="item.icon" :size="19" aria-hidden="true" />
        {{ item.label }}
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Bell, CalendarClock, CreditCard, FileText, Heart, LayoutDashboard, Search, UserRound } from '@lucide/vue'
import { getAppRoute } from '~/utils/routes'

defineEmits<{ navigate: [] }>()
const { t, locale } = useI18n()
const items = computed(() => [
  { label: t('cleaner.navigation.dashboard'), to: getAppRoute('cleanerDashboard', locale.value), icon: LayoutDashboard },
  { label: t('cleaner.navigation.jobs'), to: getAppRoute('cleanerJobs', locale.value), icon: Search },
  { label: t('cleaner.navigation.favourites'), to: getAppRoute('cleanerFavourites', locale.value), icon: Heart },
  { label: t('cleaner.navigation.offers'), to: getAppRoute('cleanerOffers', locale.value), icon: FileText },
  { label: t('cleaner.navigation.accepted'), to: getAppRoute('cleanerAcceptedJobs', locale.value), icon: CalendarClock },
  { label: t('cleaner.navigation.availability'), to: getAppRoute('cleanerAvailability', locale.value), icon: CalendarClock },
  { label: t('cleaner.navigation.profile'), to: getAppRoute('cleanerProfile', locale.value), icon: UserRound },
  { label: t('billing.navigation'), to: getAppRoute('cleanerBilling', locale.value), icon: CreditCard },
  { label: t('notifications.navigation'), to: getAppRoute('cleanerNotifications', locale.value), icon: Bell },
])
</script>

<style scoped lang="scss">
.cleaner-sidebar {
  display: grid; align-content: start; gap: $space-8; height: 100%; padding: $space-6; background: $color-primary-dark;
  :deep(.app-logo) { color: $color-surface; }
  &__links { display: grid; gap: $space-2; }
  a { display: flex; gap: $space-3; align-items: center; min-height: 2.75rem; padding: $space-3; color: rgba($color-surface, .82); text-decoration: none; border-radius: $radius-md; }
  a:hover, a.router-link-active { color: $color-primary-dark; background: $color-surface; }
}
</style>
