<template>
  <component
    :is="as"
    class="base-card"
    :class="{
      'base-card--interactive': interactive,
      'base-card--padded': padded,
    }"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  as?: 'article' | 'div' | 'section'
  interactive?: boolean
  padded?: boolean
}>(), {
  as: 'div',
  interactive: false,
  padded: true,
})
</script>

<style scoped lang="scss">
.base-card {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;

  &--padded {
    padding: $space-4;
  }

  &--interactive {
    transition:
      transform $transition-base,
      box-shadow $transition-base,
      border-color $transition-base;

    &:hover {
      border-color: $color-border-strong;
      box-shadow: $shadow-md;
      transform: translateY(-2px);
    }
  }

  @media (min-width: $breakpoint-md) {
    &--padded {
      padding: $space-6;
    }
  }
}
</style>
