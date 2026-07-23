<template>
  <div class="base-empty-state">
    <div class="base-empty-state__icon" aria-hidden="true">
      <slot name="icon">
        <SearchX :size="30" />
      </slot>
    </div>
    <h2 class="base-empty-state__title">{{ title }}</h2>
    <p class="base-empty-state__description">{{ description }}</p>
    <div v-if="$slots.action" class="base-empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchX } from '@lucide/vue'

defineProps<{
  title: string
  description: string
}>()
</script>

<style scoped lang="scss">
.base-empty-state {
  display: grid;
  justify-items: center;
  padding: $space-12 $space-6;
  text-align: center;
  background: $color-surface;
  border: 1px dashed $color-border-strong;
  border-radius: $radius-xl;

  &__icon {
    display: grid;
    width: 4rem;
    height: 4rem;
    margin-bottom: $space-5;
    color: $color-primary;
    place-items: center;
    background: $color-primary-light;
    border-radius: $radius-full;
  }

  &__title {
    font-size: $font-size-xl;
  }

  &__description {
    max-width: 32rem;
    margin-top: $space-2;
    color: $color-text-secondary;
  }

  &__action {
    margin-top: $space-6;
  }
}
</style>
