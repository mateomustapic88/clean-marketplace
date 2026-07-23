<template>
  <NuxtLayout>
    <section class="error-page">
      <BaseCard>
        <div aria-hidden="true"><SearchX :size="36" /></div>
        <p>{{ error?.statusCode ?? 404 }}</p>
        <h1>{{ t('errorPage.title') }}</h1>
        <span>{{ t('errorPage.description') }}</span>
        <BaseButton :to="localePath('/')">{{ t('errorPage.action') }}</BaseButton>
      </BaseCard>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { SearchX } from '@lucide/vue'
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: () => t('errorPage.title') })
</script>

<style scoped lang="scss">
.error-page {
  display: grid;
  min-height: 70vh;
  padding: $space-8;
  place-items: center;
  background: $color-background;

  .base-card {
    display: grid;
    justify-items: center;
    max-width: 38rem;
    text-align: center;
  }

  div {
    display: grid;
    width: 5rem;
    height: 5rem;
    color: $color-primary;
    place-items: center;
    background: $color-primary-light;
    border-radius: $radius-full;
  }

  p {
    margin-top: $space-5;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: $color-primary;
  }

  h1 {
    margin-block: $space-2;
    font-size: $font-size-2xl;
  }

  span {
    margin-bottom: $space-6;
    color: $color-text-secondary;
  }
}
</style>
