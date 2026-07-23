<template>
  <span
    class="base-skeleton"
    :class="`base-skeleton--${shape}`"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string
  height?: string
  shape?: 'text' | 'rectangle' | 'circle'
}>(), {
  width: '100%',
  height: '1rem',
  shape: 'text',
})
</script>

<style scoped lang="scss">
.base-skeleton {
  display: block;
  max-width: 100%;
  background: linear-gradient(
    90deg,
    $color-border 25%,
    $color-background 50%,
    $color-border 75%
  );
  background-size: 200% 100%;
  border-radius: $radius-sm;
  animation: skeleton 1.4s ease-in-out infinite;

  &--circle {
    border-radius: $radius-full;
  }

  &--rectangle {
    border-radius: $radius-lg;
  }
}

@keyframes skeleton {
  to {
    background-position-x: -200%;
  }
}
</style>
