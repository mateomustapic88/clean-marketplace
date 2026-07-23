<template>
  <div
    class="base-alert"
    :class="`base-alert--${variant}`"
    :role="variant === 'error' ? 'alert' : 'status'"
  >
    <component :is="icon" class="base-alert__icon" :size="20" aria-hidden="true" />
    <div class="base-alert__content">
      <p v-if="title" class="base-alert__title">{{ title }}</p>
      <div class="base-alert__message">
        <slot />
      </div>
    </div>
    <button
      v-if="dismissible"
      class="base-alert__dismiss"
      type="button"
      :aria-label="t('common.dismiss')"
      @click="emit('dismiss')"
    >
      <X :size="18" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from '@lucide/vue'
import type { Component } from 'vue'
import type { AlertVariant } from '~/types/ui'

const props = withDefaults(defineProps<{
  variant?: AlertVariant
  title?: string
  dismissible?: boolean
}>(), {
  variant: 'info',
  dismissible: false,
})

const emit = defineEmits<{ dismiss: [] }>()
const { t } = useI18n()
const icons: Record<AlertVariant, Component> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}
const icon = computed(() => icons[props.variant])
</script>

<style scoped lang="scss">
.base-alert {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: $space-3;
  align-items: start;
  padding: $space-4;
  font-size: $font-size-sm;
  border: 1px solid;
  border-radius: $radius-lg;

  &--info {
    color: $color-info;
    background: $color-info-light;
    border-color: rgba($color-info, 0.25);
  }

  &--success {
    color: $color-success;
    background: $color-success-light;
    border-color: rgba($color-success, 0.25);
  }

  &--warning {
    color: $color-warning;
    background: $color-warning-light;
    border-color: rgba($color-warning, 0.25);
  }

  &--error {
    color: $color-error;
    background: $color-error-light;
    border-color: rgba($color-error, 0.25);
  }

  &__title {
    font-weight: $font-weight-semibold;
  }

  &__message {
    color: $color-text-primary;
  }

  &__dismiss {
    display: grid;
    width: 2rem;
    height: 2rem;
    padding: 0;
    color: currentColor;
    cursor: pointer;
    place-items: center;
    background: transparent;
    border: 0;
    border-radius: $radius-sm;
  }
}
</style>
