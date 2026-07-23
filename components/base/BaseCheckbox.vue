<template>
  <div class="base-checkbox">
    <label class="base-checkbox__label">
      <input
        v-model="model"
        class="base-checkbox__input"
        type="checkbox"
        :name="name"
        :value="value"
        :disabled="disabled"
        :required="required"
      >
      <span class="base-checkbox__control" aria-hidden="true">
        <Check :size="14" :stroke-width="3" />
      </span>
      <span>{{ label }}</span>
    </label>
    <p v-if="hint" class="base-checkbox__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'

withDefaults(defineProps<{
  label: string
  name?: string
  value?: string
  hint?: string
  disabled?: boolean
  required?: boolean
}>(), {
  disabled: false,
  required: false,
})

const model = defineModel<boolean | string[]>({ default: false })
</script>

<style scoped lang="scss">
.base-checkbox {
  display: grid;
  gap: $space-1;

  &__label {
    display: inline-flex;
    gap: $space-3;
    align-items: flex-start;
    width: fit-content;
    font-size: $font-size-sm;
    cursor: pointer;
  }

  &__input {
    @include visually-hidden;
  }

  &__control {
    display: grid;
    flex: 0 0 1.25rem;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.1rem;
    color: transparent;
    place-items: center;
    background: $color-surface;
    border: 1px solid $color-border-strong;
    border-radius: 0.35rem;
    transition: $transition-fast;
  }

  &__input:checked + &__control {
    color: $color-surface;
    background: $color-primary;
    border-color: $color-primary;
  }

  &__input:focus-visible + &__control {
    @include focus-ring;
  }

  &__input:disabled ~ * {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &__hint {
    padding-left: $space-8;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}
</style>
