<template>
  <header class="public-header">
    <div class="public-header__inner container">
      <AppLogo />
      <nav class="public-header__navigation" :aria-label="t('navigation.primaryLabel')">
        <NuxtLink v-for="item in items" :key="item.label" :to="item.to">
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="public-header__actions">
        <LanguageSwitcher class="public-header__language" />
        <BaseButton v-if="!user" class="public-header__desktop-action" size="sm" variant="ghost" :to="loginRoute">
          {{ t('header.login') }}
        </BaseButton>
        <BaseButton v-if="!user" class="public-header__desktop-action" size="sm" :to="registerRoute">
          {{ t('header.register') }}
        </BaseButton>
        <BaseButton v-if="user" class="public-header__desktop-action" size="sm" :to="dashboardRoute">
          {{ t('header.dashboard') }}
        </BaseButton>
        <button
          class="public-header__menu"
          type="button"
          :aria-label="t('common.menu')"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = true"
        >
          <Menu :size="24" aria-hidden="true" />
        </button>
      </div>
    </div>
    <MobileNavigationDrawer
      v-model="mobileOpen"
      :items="items"
      :user="user"
      :login-route="loginRoute"
      :register-route="registerRoute"
      :dashboard-route="dashboardRoute"
      @logout="logout"
    />
  </header>
</template>

<script setup lang="ts">
import { Menu } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import AppLogo from '~/components/layout/AppLogo.vue'
import LanguageSwitcher from '~/components/navigation/LanguageSwitcher.vue'
import { useAuthStore } from '~/stores/auth'
import { getAppRoute, getRoleDashboardRoute } from '~/utils/routes'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const mobileOpen = ref(false)
const items = computed(() => [
  { label: t('navigation.home'), to: getAppRoute('home', locale.value) },
  { label: t('navigation.jobs'), to: getAppRoute('jobs', locale.value) },
  { label: t('navigation.cleaners'), to: getAppRoute('cleaners', locale.value) },
  { label: t('navigation.howItWorks'), to: getAppRoute('howItWorks', locale.value) },
  { label: t('navigation.pricing'), to: getAppRoute('pricing', locale.value) },
])
const loginRoute = computed(() => getAppRoute('login', locale.value))
const registerRoute = computed(() => getAppRoute('register', locale.value))
const dashboardRoute = computed(() => user.value
  ? getRoleDashboardRoute(user.value.role, locale.value)
  : getAppRoute('home', locale.value))

const logout = async () => {
  await authStore.logout()
  mobileOpen.value = false
  await navigateTo(getAppRoute('home', locale.value))
}
</script>

<style scoped lang="scss">
.public-header {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  background: rgba($color-surface, 0.96);
  border-bottom: 1px solid rgba($color-border, 0.9);
  backdrop-filter: blur(16px);

  &__inner {
    display: flex;
    gap: $space-5;
    align-items: center;
    justify-content: space-between;
    min-height: $header-height;
  }

  &__navigation {
    display: none;
    gap: $space-5;
    align-items: center;
    margin-left: auto;

    a {
      position: relative;
      padding-block: $space-3;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $color-text-secondary;
      text-decoration: none;
    }

    a:hover,
    a.router-link-active {
      color: $color-primary;
    }

    a.router-link-active::after {
      position: absolute;
      right: 0;
      bottom: 0.25rem;
      left: 0;
      height: 2px;
      content: '';
      background: $color-primary;
    }
  }

  &__actions {
    display: flex;
    gap: $space-2;
    align-items: center;
  }

  &__desktop-action,
  &__language {
    display: none;
  }

  &__menu {
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    cursor: pointer;
    place-items: center;
    background: transparent;
    border: 1px solid $color-border;
    border-radius: $radius-md;
  }

  @media (min-width: $breakpoint-lg) {
    &__navigation,
    &__desktop-action,
    &__language {
      display: flex;
    }

    &__menu {
      display: none;
    }
  }
}
</style>
