<template>
  <div class="cleaner-layout">
    <aside class="cleaner-layout__sidebar"><CleanerSidebar /></aside>
    <div class="cleaner-layout__body">
      <CleanerHeader :user="authStore.user" :notification-to="getAppRoute('cleanerNotifications', locale)" :unread-count="notificationsStore.unreadCount" @menu="menuOpen = true" @logout="logout" />
      <main id="main-content" class="cleaner-layout__content"><slot /></main>
    </div>
    <BaseDrawer v-model="menuOpen" :title="t('cleaner.navigation.label')"><CleanerSidebar @navigate="menuOpen = false" /></BaseDrawer>
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
.cleaner-layout {
  min-height: 100vh; background: $color-background;
  &__sidebar { display: none; }
  &__content { width: min(100% - 2rem, 76rem); margin-inline: auto; padding-block: $space-8 $space-16; }
  @media (min-width: $breakpoint-lg) { display: grid; grid-template-columns: 17rem minmax(0, 1fr); &__sidebar { position: sticky; top: 0; display: block; height: 100vh; } }
}
</style>
