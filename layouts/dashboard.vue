<template>
  <div class="dashboard-layout">
    <a class="dashboard-layout__skip-link" href="#main-content">{{ t('navigation.skipToContent') }}</a>
    <aside class="dashboard-layout__sidebar"><DashboardSidebar /></aside>
    <div class="dashboard-layout__body">
      <DashboardHeader :user="authStore.user" :notification-to="getAppRoute('ownerNotifications', locale)" :unread-count="notificationsStore.unreadCount" @menu="menuOpen = true" @logout="logout" />
      <main id="main-content" class="dashboard-layout__content" tabindex="-1">
        <ProfileCompletionNotice />
        <slot />
      </main>
    </div>
    <BaseDrawer v-model="menuOpen" :title="t('owner.navigation.label')"><DashboardSidebar @navigate="menuOpen = false" /></BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useNotificationsStore } from '~/stores/notifications'
import { getAppRoute } from '~/utils/routes'

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const menuOpen = ref(false)
const { t, locale } = useI18n()
watch(
  () => authStore.user?.id,
  async (userId) => {
    if (userId) await notificationsStore.loadForUser(userId)
  },
  { immediate: true },
)
const logout = async () => {
  await authStore.logout()
  await navigateTo(getAppRoute('login', locale.value))
}
</script>

<style scoped lang="scss">
.dashboard-layout {
  min-height: 100vh;
  overflow-x: clip;
  background: $color-background;

  &__sidebar { display: none; }
  &__skip-link {
    position: fixed;
    top: $space-3;
    left: $space-3;
    z-index: calc($z-modal + 1);
    padding: $space-3 $space-4;
    color: $color-surface;
    pointer-events: none;
    background: $color-primary-dark;
    border-radius: $radius-md;
    opacity: 0;
    transform: translateY(-150%);
    &:focus { pointer-events: auto; opacity: 1; transform: translateY(0); }
  }
  &__body,
  &__content { min-width: 0; }
  &__content { width: min(calc(100% - 2rem), 76rem); margin-inline: auto; padding-block: $space-6 $space-12; }
  &__content:focus { outline: none; }

  @media (min-width: $breakpoint-lg) {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
    &__sidebar { position: sticky; top: 0; display: block; height: 100vh; }
    &__content { padding-block: $space-8 $space-16; }
  }
}
</style>
