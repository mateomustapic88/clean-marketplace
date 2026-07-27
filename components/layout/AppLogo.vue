<template>
  <NuxtLink
    class="app-logo"
    :to="localePath('/')"
    :aria-label="t('header.brandLabel')"
  >
    <svg
      class="app-logo__mark"
      viewBox="0 0 44 44"
      aria-hidden="true"
    >
      <rect width="44" height="44" rx="12" fill="currentColor" />
      <path
        d="M29.4 14.2a11.6 11.6 0 1 0 0 15.7"
        fill="none"
        stroke="#fff"
        stroke-width="4.8"
        stroke-linecap="round"
      />
      <path
        d="m30.2 9.8 1.2 2.9 2.9 1.2-2.9 1.2-1.2 2.9-1.2-2.9-2.9-1.2 2.9-1.2 1.2-2.9Z"
        fill="#D9A441"
      />
    </svg>
    <span class="app-logo__name">{{ t('meta.siteName') }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<style scoped lang="scss">
.app-logo {
  display: inline-flex;
  gap: $space-3;
  align-items: center;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-primary-dark;
  text-decoration: none;

  &__mark {
    flex: 0 0 auto;
    width: 2.5rem;
    height: 2.5rem;
    color: $color-primary-dark;
  }

  &__name {
    white-space: nowrap;
    letter-spacing: -0.03em;
  }

  @media (max-width: 30rem) {
    gap: $space-2;
    font-size: $font-size-lg;

    &__mark {
      width: 2.25rem;
      height: 2.25rem;
    }
  }
}
</style>
