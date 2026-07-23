<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="base-button"
    :class="classes"
    :aria-busy="loading"
    :aria-disabled="disabled || loading"
    :tabindex="disabled || loading ? -1 : undefined"
    @click="handleLinkClick"
  >
    <LoaderCircle
      v-if="loading"
      class="base-button__spinner"
      :size="18"
      aria-hidden="true"
    />
    <slot />
  </NuxtLink>
  <button
    v-else
    class="base-button"
    :class="classes"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    @click="emit('click', $event)"
  >
    <LoaderCircle
      v-if="loading"
      class="base-button__spinner"
      :size="18"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'
import type { ButtonSize, ButtonVariant } from '~/types/ui'

const props = withDefaults(defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  to?: RouteLocationRaw
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
})
const emit = defineEmits<{ click: [event: MouseEvent] }>()

const classes = computed(() => [
  `base-button--${props.variant}`,
  `base-button--${props.size}`,
  {
    'base-button--block': props.block,
    'base-button--disabled': props.disabled || props.loading,
  },
])

const handleLinkClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style scoped lang="scss">
.base-button {
  display: inline-flex;
  gap: $space-2;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem $space-5;
  font-weight: $font-weight-semibold;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: $radius-md;
  transition:
    color $transition-fast,
    background-color $transition-fast,
    border-color $transition-fast,
    transform $transition-fast,
    box-shadow $transition-fast;

  &:hover:not(:disabled, .base-button--disabled) {
    transform: translateY(-1px);
  }

  &:disabled,
  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &--primary {
    color: $color-surface;
    background: $color-primary;
    box-shadow: $shadow-sm;

    &:hover:not(:disabled, .base-button--disabled) {
      background: $color-primary-hover;
      box-shadow: $shadow-md;
    }
  }

  &--secondary {
    color: $color-primary-dark;
    background: $color-surface;
    border-color: $color-border-strong;

    &:hover:not(:disabled, .base-button--disabled) {
      background: $color-primary-light;
      border-color: $color-primary;
    }
  }

  &--ghost {
    color: $color-primary-dark;
    background: transparent;

    &:hover:not(:disabled, .base-button--disabled) {
      background: $color-primary-light;
    }
  }

  &--danger {
    color: $color-surface;
    background: $color-error;

    &:hover:not(:disabled, .base-button--disabled) {
      background: #983b3b;
    }
  }

  &--sm {
    min-height: 2.25rem;
    padding: $space-2 $space-4;
    font-size: $font-size-sm;
  }

  &--lg {
    min-height: 3.25rem;
    padding: $space-3 $space-6;
  }

  &--block {
    width: 100%;
  }

  &__spinner {
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
