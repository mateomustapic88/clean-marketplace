<template>
  <nav class="dashboard-sidebar" :aria-label="t('owner.navigation.label')">
    <AppLogo />
    <div class="dashboard-sidebar__links">
      <NuxtLink v-for="item in items" :key="item.to" :to="item.to" @click="$emit('navigate')">
        <component :is="item.icon" :size="19" aria-hidden="true" />{{ item.label }}
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Bell, BriefcaseBusiness, CirclePlus, CreditCard, LayoutDashboard, Settings, UserRound } from '@lucide/vue'
import { getAppRoute } from '~/utils/routes'

defineEmits<{ navigate: [] }>()
const { t, locale } = useI18n()
const items = computed(() => [
  { label: t('owner.navigation.dashboard'), to: getAppRoute('ownerDashboard', locale.value), icon: LayoutDashboard },
  { label: t('owner.navigation.jobs'), to: getAppRoute('ownerJobs', locale.value), icon: BriefcaseBusiness },
  { label: t('owner.navigation.newJob'), to: getAppRoute('ownerNewJob', locale.value), icon: CirclePlus },
  { label: t('owner.navigation.profile'), to: getAppRoute('ownerProfile', locale.value), icon: UserRound },
  { label: t('owner.navigation.settings'), to: getAppRoute('ownerSettings', locale.value), icon: Settings },
  { label: t('billing.navigation'), to: getAppRoute('ownerBilling', locale.value), icon: CreditCard },
  { label: t('notifications.navigation'), to: getAppRoute('ownerNotifications', locale.value), icon: Bell },
])
</script>

<style scoped lang="scss">
.dashboard-sidebar {
  display: grid;
  align-content: start;
  gap: $space-8;
  height: 100%;
  padding: $space-6;
  background: $color-primary-dark;

  :deep(.app-logo) { color: $color-surface; }

  &__links {
    display: grid;
    gap: $space-2;

    a {
      display: flex;
      gap: $space-3;
      align-items: center;
      min-height: 2.75rem;
      padding: $space-3;
      color: rgba($color-surface, 0.82);
      text-decoration: none;
      border-radius: $radius-md;
    }

    a:hover,
    a.router-link-active {
      color: $color-primary-dark;
      background: $color-surface;
    }
  }
}
</style>
