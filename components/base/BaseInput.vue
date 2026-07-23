<template>
  <div class="base-input" :class="{ 'base-input--error': error }">
    <label class="base-input__label" :for="inputId">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>
    <div class="base-input__control">
      <slot name="leading" />
      <input
        :id="inputId"
        v-model="model"
        class="base-input__field"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :required="required"
        :aria-invalid="Boolean(error)"
        :aria-describedby="descriptionId"
      >
      <slot name="trailing" />
    </div>
    <p v-if="error" :id="errorId" class="base-input__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="base-input__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  id?: string
  label: string
  name?: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'search' | 'url' | 'date' | 'time' | 'datetime-local'
  placeholder?: string
  autocomplete?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
}>(), {
  type: 'text',
  disabled: false,
  required: false,
})

const model = defineModel<string | number | null>({ default: '' })
const generatedId = useId()
const inputId = computed(() => props.id ?? `input-${generatedId}`)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)
const descriptionId = computed(() => props.error
  ? errorId.value
  : props.hint
    ? hintId.value
    : undefined)
</script>

<style scoped lang="scss">
.base-input {
  display: grid;
  gap: $space-2;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__control {
    display: flex;
    align-items: center;
    background: $color-surface;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    transition:
      border-color $transition-fast,
      box-shadow $transition-fast;

    &:focus-within {
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-primary, 0.14);
    }
  }

  &__field {
    width: 100%;
    min-width: 0;
    min-height: 3rem;
    padding: 0.75rem 0.875rem;
    color: $color-text-primary;
    background: transparent;
    border: 0;
    outline: 0;

    &::placeholder {
      color: $color-text-secondary;
      opacity: 0.8;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  :deep(button) {
    display: grid;
    flex: 0 0 auto;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    margin-right: $space-1;
    color: $color-text-secondary;
    cursor: pointer;
    place-items: center;
    background: transparent;
    border: 0;
    border-radius: $radius-md;

    &:hover {
      color: $color-primary;
      background: $color-primary-light;
    }
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

  &--error &__control {
    border-color: $color-error;
  }
}
</style>
