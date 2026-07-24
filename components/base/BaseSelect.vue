<template>
  <div class="base-select" :class="{ 'base-select--error': error }">
    <label class="base-select__label" :for="selectId">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>
    <div class="base-select__control">
      <select
        :id="selectId"
        v-model="model"
        class="base-select__field"
        :name="name"
        :disabled="disabled"
        :required="required"
        :aria-invalid="Boolean(error)"
        :aria-describedby="descriptionId"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <ChevronDown class="base-select__icon" :size="18" aria-hidden="true" />
    </div>
    <p v-if="error" :id="errorId" class="base-select__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="base-select__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { SelectOption } from '~/types/ui'

const props = withDefaults(defineProps<{
  id?: string
  label: string
  name?: string
  options: SelectOption[]
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
}>(), {
  disabled: false,
  required: false,
})

const model = defineModel<string | number>({ default: '' })
const generatedId = useId()
const selectId = computed(() => props.id ?? `select-${generatedId}`)
const errorId = computed(() => `${selectId.value}-error`)
const hintId = computed(() => `${selectId.value}-hint`)
const descriptionId = computed(() => props.error
  ? errorId.value
  : props.hint
    ? hintId.value
    : undefined)
</script>

<style scoped lang="scss">
.base-select {
  display: grid;
  gap: $space-2;
  min-width: 0;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__control {
    position: relative;
    min-width: 0;
    max-width: 100%;
  }

  &__field {
    @include field-base;
    min-width: 0;
    max-width: 100%;
    padding-inline-end: 2.75rem;
    appearance: none;
    cursor: pointer;
  }

  &__icon {
    position: absolute;
    top: 50%;
    right: $space-4;
    color: $color-text-secondary;
    pointer-events: none;
    transform: translateY(-50%);
  }

  &__field:disabled + &__icon {
    opacity: 0.6;
  }

  &__hint,
  &__error {
    font-size: $font-size-xs;
  }

  &__hint {
    color: $color-text-secondary;
  }

  &__error {
    color: $color-error;
  }

  &--error &__field {
    border-color: $color-error;
  }
}
</style>
