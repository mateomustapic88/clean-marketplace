<template>
  <label class="base-radio">
    <input
      v-model="model"
      class="base-radio__input"
      type="radio"
      :name="name"
      :value="value"
      :disabled="disabled"
      :required="required"
    >
    <span class="base-radio__control" aria-hidden="true" />
    <span class="base-radio__content">
      <span class="base-radio__label">{{ label }}</span>
      <span v-if="description" class="base-radio__description">{{ description }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string | number
  name?: string
  description?: string
  disabled?: boolean
  required?: boolean
}>(), {
  disabled: false,
  required: false,
})

const model = defineModel<string | number>({ required: true })
</script>

<style scoped lang="scss">
.base-radio {
  display: inline-flex;
  gap: $space-3;
  align-items: flex-start;
  width: fit-content;
  cursor: pointer;

  &__input {
    @include visually-hidden;
  }

  &__control {
    flex: 0 0 1.25rem;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.1rem;
    background: $color-surface;
    border: 1px solid $color-border-strong;
    border-radius: $radius-full;
    box-shadow: inset 0 0 0 0.25rem $color-surface;
    transition: $transition-fast;
  }

  &__input:checked + &__control {
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

  &__content {
    display: grid;
    gap: $space-1;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__description {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}
</style>
