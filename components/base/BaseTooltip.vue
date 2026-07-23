<template>
  <span
    class="base-tooltip"
    tabindex="0"
    :aria-describedby="tooltipId"
  >
    <slot />
    <span
      :id="tooltipId"
      class="base-tooltip__content"
      role="tooltip"
    >
      {{ text }}
    </span>
  </span>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()

const tooltipId = `tooltip-${useId()}`
</script>

<style scoped lang="scss">
.base-tooltip {
  position: relative;
  display: inline-flex;

  &__content {
    position: absolute;
    bottom: calc(100% + $space-2);
    left: 50%;
    z-index: $z-tooltip;
    width: max-content;
    max-width: 16rem;
    padding: $space-2 $space-3;
    font-size: $font-size-xs;
    color: $color-surface;
    pointer-events: none;
    visibility: hidden;
    background: $color-primary-dark;
    border-radius: $radius-sm;
    opacity: 0;
    transform: translateX(-50%) translateY($space-1);
    transition:
      opacity $transition-fast,
      transform $transition-fast,
      visibility $transition-fast;
  }

  &:hover &__content,
  &:focus-within &__content {
    visibility: visible;
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
