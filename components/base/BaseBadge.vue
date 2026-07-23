<template>
  <span class="base-badge" :class="`base-badge--${variant}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { BadgeVariant } from '~/types/ui'

withDefaults(defineProps<{
  variant?: BadgeVariant
}>(), {
  variant: 'neutral',
})
</script>

<style scoped lang="scss">
.base-badge {
  display: inline-flex;
  gap: $space-1;
  align-items: center;
  width: fit-content;
  padding: 0.3rem $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
  border-radius: $radius-full;

  &--neutral {
    color: $color-text-secondary;
    background: $color-background;
  }

  &--primary {
    color: $color-primary-dark;
    background: $color-primary-light;
  }

  &--success {
    color: $color-success;
    background: $color-success-light;
  }

  &--warning {
    color: $color-warning;
    background: $color-warning-light;
  }

  &--error {
    color: $color-error;
    background: $color-error-light;
  }

  &--premium {
    color: #77530f;
    background: $color-accent-light;
  }
}
</style>
