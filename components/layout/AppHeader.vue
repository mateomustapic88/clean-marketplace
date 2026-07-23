<template>
  <header class="app-header">
    <div class="app-header__inner container">
      <AppLogo />
      <nav class="app-header__navigation" :aria-label="t('navigation.primaryLabel')">
        <NuxtLink
          v-for="item in navigation"
          :key="item.key"
          class="app-header__link"
          :to="item.to"
        >
          {{ t(item.key) }}
        </NuxtLink>
      </nav>
      <div class="app-header__actions">
        <LanguageSwitcher />
        <BaseButton
          v-if="!user"
          class="app-header__cta"
          size="sm"
          variant="ghost"
          :to="getAppRoute('login', locale)"
        >
          {{ t('header.login') }}
        </BaseButton>
        <BaseButton
          v-if="!user"
          class="app-header__cta"
          size="sm"
          :to="getAppRoute('register', locale)"
        >
          {{ t('header.register') }}
        </BaseButton>
        <BaseButton
          v-if="user"
          class="app-header__cta"
          size="sm"
          :to="getRoleDashboardRoute(user.role, locale)"
        >
          {{ t('header.dashboard') }}
        </BaseButton>
        <BaseButton
          v-if="user"
          class="app-header__cta"
          size="sm"
          variant="ghost"
          @click="logout"
        >
          {{ t('header.logout') }}
        </BaseButton>
        <button
          class="app-header__menu"
          type="button"
          :aria-label="t('common.menu')"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = true"
        >
          <Menu :size="24" aria-hidden="true" />
        </button>
      </div>
    </div>
    <BaseDrawer v-model="mobileOpen" :title="t('common.menu')">
      <nav class="app-header__mobile-nav" :aria-label="t('navigation.mobileLabel')">
        <NuxtLink
          v-for="item in navigation"
          :key="item.key"
          class="app-header__mobile-link"
          :to="item.to"
          @click="mobileOpen = false"
        >
          {{ t(item.key) }}
        </NuxtLink>
        <template v-if="user">
          <BaseButton
            block
            :to="getRoleDashboardRoute(user.role, locale)"
            @click="mobileOpen = false"
          >
            {{ t('header.dashboard') }}
          </BaseButton>
          <BaseButton block variant="secondary" @click="logout">
            {{ t('header.logout') }}
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton
            block
            :to="getAppRoute('register', locale)"
            @click="mobileOpen = false"
          >
            {{ t('header.register') }}
          </BaseButton>
          <BaseButton
            block
            variant="secondary"
            :to="getAppRoute('login', locale)"
            @click="mobileOpen = false"
          >
            {{ t('header.login') }}
          </BaseButton>
        </template>
      </nav>
    </BaseDrawer>
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
const localePath = useLocalePath()
const mobileOpen = ref(false)
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const navigation = computed(() => [
  {
    key: 'navigation.home',
    to: localePath('/'),
  },
  {
    key: 'navigation.foundation',
    to: { path: localePath('/'), hash: '#foundation' },
  },
  {
    key: 'navigation.components',
    to: { path: localePath('/'), hash: '#components' },
  },
  {
    key: 'navigation.nextSteps',
    to: { path: localePath('/'), hash: '#next' },
  },
])

const logout = async () => {
  await authStore.logout()
  mobileOpen.value = false
  await navigateTo(getAppRoute('home', locale.value))
}
</script>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  background: rgba($color-surface, 0.94);
  border-bottom: 1px solid rgba($color-border, 0.86);
  backdrop-filter: blur(14px);

  &__inner {
    display: flex;
    gap: $space-6;
    align-items: center;
    justify-content: space-between;
    min-height: $header-height;
  }

  &__navigation {
    display: none;
    gap: $space-6;
    align-items: center;
    margin-left: auto;
  }

  &__link {
    position: relative;
    padding-block: $space-2;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    text-decoration: none;

    &:hover {
      color: $color-primary;
    }
  }

  &__actions {
    display: flex;
    gap: $space-3;
    align-items: center;
  }

  &__cta {
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

  &__mobile-nav {
    display: grid;
    gap: $space-3;
  }

  &__mobile-link {
    min-height: 2.75rem;
    padding: $space-3;
    font-weight: $font-weight-semibold;
    color: $color-primary-dark;
    text-decoration: none;
    border-radius: $radius-md;

    &:hover {
      background: $color-primary-light;
    }
  }
}

@media (min-width: $breakpoint-md) {
  .app-header {
    &__cta {
      display: inline-flex;
    }
  }
}

@media (min-width: $breakpoint-lg) {
  .app-header {
    &__navigation {
      display: flex;
    }

    &__menu {
      display: none;
    }
  }
}
</style>
