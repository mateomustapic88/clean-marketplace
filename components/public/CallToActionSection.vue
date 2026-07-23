<template>
  <section class="call-to-action">
    <div>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div class="call-to-action__actions">
      <BaseButton size="lg" :to="primaryTo">{{ primaryLabel }}</BaseButton>
      <BaseButton v-if="secondaryLabel && secondaryTo" size="lg" variant="secondary" :to="secondaryTo">
        {{ secondaryLabel }}
      </BaseButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
defineProps<{
  title: string
  description: string
  primaryLabel: string
  primaryTo: RouteLocationRaw
  secondaryLabel?: string
  secondaryTo?: RouteLocationRaw
}>()
</script>

<style scoped lang="scss">
.call-to-action {
  display: grid;
  gap: $space-8;
  align-items: center;
  padding: $space-10;
  color: $color-surface;
  background: linear-gradient(135deg, $color-primary-dark, $color-primary);
  border-radius: $radius-xl;
  box-shadow: $shadow-lg;

  h2 {
    font-size: $font-size-2xl;
  }

  p {
    max-width: 42rem;
    margin-top: $space-3;
    color: rgba($color-surface, 0.82);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
  }

  @media (min-width: $breakpoint-lg) {
    grid-template-columns: 1fr auto;
  }
}
</style>
