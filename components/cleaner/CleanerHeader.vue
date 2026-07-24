<template>
  <header class="cleaner-header">
    <button class="cleaner-header__menu" type="button" :aria-label="t('cleaner.navigation.open')" @click="$emit('menu')"><Menu :size="22" /></button>
    <div class="cleaner-header__identity"><BaseAvatar :name="user?.displayName ?? 'Clean'" /><div><strong>{{ user?.displayName }}</strong><small>{{ t('cleaner.navigation.account') }}</small></div></div>
    <NuxtLink class="cleaner-header__notifications" :to="notificationTo" :aria-label="t('notifications.title')"><Bell :size="21" aria-hidden="true" /><span v-if="unreadCount" aria-hidden="true">{{ unreadCount > 99 ? '99+' : unreadCount }}</span></NuxtLink>
    <LanguageSwitcher />
    <BaseButton size="sm" variant="ghost" @click="$emit('logout')">{{ t('header.logout') }}</BaseButton>
  </header>
</template>

<script setup lang="ts">
import { Bell, Menu } from '@lucide/vue'
import type { User } from '~/domains/users/types'

defineProps<{ user: User | null, notificationTo: string, unreadCount: number }>()
defineEmits<{ menu: [], logout: [] }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.cleaner-header {
  position: sticky; top: 0; z-index: $z-sticky; display: flex; gap: $space-3; align-items: center; min-height: $header-height; padding-inline: $space-4; background: $color-surface; border-bottom: 1px solid $color-border;
  &__menu { display: grid; width: 2.75rem; height: 2.75rem; padding: 0; place-items: center; background: transparent; border: 1px solid $color-border; border-radius: $radius-md; }
  &__identity { display: flex; flex: 1; gap: $space-3; align-items: center; div { display: grid; } small { color: $color-text-secondary; } }
  &__notifications { position: relative; display: grid; width: 2.75rem; height: 2.75rem; color: $color-text-primary; place-items: center; border: 1px solid $color-border; border-radius: $radius-md; span { position: absolute; top: -.35rem; right: -.35rem; min-width: 1.25rem; padding: .1rem .25rem; font-size: $font-size-xs; color: $color-surface; text-align: center; background: $color-error; border-radius: $radius-full; } }
  @media (min-width: $breakpoint-lg) { &__menu { display: none; } }
  @media (max-width: 30rem) {
    gap: $space-2;
    padding-inline: $space-2;
    &__identity { display: none; }
  }
}
</style>
