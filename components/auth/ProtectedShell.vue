<template>
  <section class="protected-shell">
    <div class="protected-shell__container container">
      <div class="protected-shell__heading">
        <div class="protected-shell__icon" aria-hidden="true">
          <ShieldCheck :size="28" />
        </div>
        <div>
          <BaseBadge v-if="isDemo" variant="primary">
            {{ t('demo.profileBadge') }}
          </BaseBadge>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
      </div>
      <BaseCard class="protected-shell__card">
        <slot />
      </BaseCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'

withDefaults(defineProps<{
  title: string
  description: string
  isDemo?: boolean
}>(), {
  isDemo: false,
})

const { t } = useI18n()
</script>

<style scoped lang="scss">
.protected-shell {
  min-height: calc(100vh - $header-height);
  padding-block: $space-12;
  background:
    radial-gradient(circle at 90% 10%, rgba($color-accent, 0.1), transparent 20rem),
    $color-background;

  &__container {
    display: grid;
    gap: $space-8;
  }

  &__heading {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: $space-5;
    align-items: start;

    h1 {
      margin-top: $space-3;
      font-size: $font-size-2xl;
      line-height: $line-height-tight;
    }

    p {
      max-width: 44rem;
      margin-top: $space-3;
      color: $color-text-secondary;
    }
  }

  &__icon {
    display: grid;
    width: 3.5rem;
    height: 3.5rem;
    color: $color-primary;
    place-items: center;
    background: $color-primary-light;
    border-radius: $radius-lg;
  }

  &__card {
    display: grid;
    gap: $space-5;
    max-width: 52rem;
  }
}
</style>
