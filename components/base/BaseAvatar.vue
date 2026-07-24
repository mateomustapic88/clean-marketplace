<template>
  <span
    class="base-avatar"
    :class="`base-avatar--${size}`"
    :aria-label="name"
    role="img"
  >
    <img
      v-if="src"
      class="base-avatar__image"
      :src="src"
      :alt="name"
      decoding="async"
      loading="lazy"
    >
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

const initials = computed(() => props.name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part.charAt(0))
  .join('')
  .toUpperCase())
</script>

<style scoped lang="scss">
.base-avatar {
  display: inline-grid;
  overflow: hidden;
  font-weight: $font-weight-bold;
  color: $color-primary-dark;
  place-items: center;
  background: $color-primary-light;
  border: 1px solid rgba($color-primary, 0.16);
  border-radius: $radius-full;

  &--sm {
    width: 2rem;
    height: 2rem;
    font-size: $font-size-xs;
  }

  &--md {
    width: 3rem;
    height: 3rem;
    font-size: $font-size-sm;
  }

  &--lg {
    width: 4.5rem;
    height: 4.5rem;
    font-size: $font-size-xl;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
