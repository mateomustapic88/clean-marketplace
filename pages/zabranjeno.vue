<template>
  <section class="forbidden-page">
    <BaseCard class="forbidden-page__card">
      <div class="forbidden-page__icon" aria-hidden="true">
        <ShieldX :size="34" />
      </div>
      <h1>{{ t('auth.forbidden.title') }}</h1>
      <p>{{ t('auth.forbidden.description') }}</p>
      <BaseButton :to="destination">
        {{ t('auth.forbidden.action') }}
      </BaseButton>
    </BaseCard>
  </section>
</template>

<script setup lang="ts">
import { ShieldX } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { getAppRoute, getRoleDashboardRoute } from '~/utils/routes'

defineI18nRoute({
  paths: {
    hr: '/zabranjeno',
    en: '/forbidden',
    sl: '/prepovedano',
  },
})

const { t, locale } = useI18n()
const authStore = useAuthStore()
const destination = computed(() => authStore.user
  ? getRoleDashboardRoute(authStore.user.role, locale.value)
  : getAppRoute('home', locale.value))

useSeoMeta({
  title: () => t('auth.forbidden.metaTitle'),
  description: () => t('auth.forbidden.description'),
})
</script>

<style scoped lang="scss">
.forbidden-page {
  display: grid;
  min-height: calc(100vh - $header-height);
  padding: $space-6;
  place-items: center;
  background: $color-background;

  &__card {
    display: grid;
    justify-items: center;
    max-width: 36rem;
    padding: $space-10;
    text-align: center;

    h1 {
      margin-top: $space-5;
      font-size: $font-size-2xl;
    }

    p {
      margin: $space-3 0 $space-6;
      color: $color-text-secondary;
    }
  }

  &__icon {
    display: grid;
    width: 4.5rem;
    height: 4.5rem;
    color: $color-error;
    place-items: center;
    background: $color-error-light;
    border-radius: $radius-full;
  }
}
</style>
