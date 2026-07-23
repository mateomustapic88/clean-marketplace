<template>
  <BaseDrawer v-model="model" :title="t('common.menu')">
    <nav class="mobile-navigation" :aria-label="t('navigation.mobileLabel')">
      <NuxtLink
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        @click="model = false"
      >
        {{ item.label }}
      </NuxtLink>
      <div class="mobile-navigation__language"><LanguageSwitcher /></div>
      <BaseButton v-if="!user" block :to="loginRoute" @click="model = false">
        {{ t('header.login') }}
      </BaseButton>
      <BaseButton v-if="!user" block variant="secondary" :to="registerRoute" @click="model = false">
        {{ t('header.register') }}
      </BaseButton>
      <BaseButton v-if="user" block :to="dashboardRoute" @click="model = false">
        {{ t('header.dashboard') }}
      </BaseButton>
      <BaseButton v-if="user" block variant="secondary" @click="$emit('logout')">
        {{ t('header.logout') }}
      </BaseButton>
    </nav>
  </BaseDrawer>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { User } from '~/domains/users/types'

defineProps<{
  items: Array<{ label: string, to: RouteLocationRaw }>
  user: User | null
  loginRoute: string
  registerRoute: string
  dashboardRoute: string
}>()
defineEmits<{ logout: [] }>()
const model = defineModel<boolean>({ default: false })
const { t } = useI18n()
</script>

<style scoped lang="scss">
.mobile-navigation {
  display: grid;
  gap: $space-3;

  > a:not(.base-button) {
    min-height: 2.75rem;
    padding: $space-3;
    font-weight: $font-weight-semibold;
    color: $color-primary-dark;
    text-decoration: none;
    border-radius: $radius-md;

    &.router-link-active {
      color: $color-primary;
      background: $color-primary-light;
    }
  }

  &__language {
    padding-block: $space-3;
    border-block: 1px solid $color-border;
  }
}
</style>
