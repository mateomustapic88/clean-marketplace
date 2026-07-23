<template>
  <div class="base-textarea" :class="{ 'base-textarea--error': error }">
    <label class="base-textarea__label" :for="textareaId">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>
    <textarea
      :id="textareaId"
      v-model="model"
      class="base-textarea__field"
      :name="name"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :required="required"
      :aria-invalid="Boolean(error)"
      :aria-describedby="descriptionId"
    />
    <p v-if="error" :id="errorId" class="base-textarea__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="base-textarea__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  id?: string
  label: string
  name?: string
  placeholder?: string
  hint?: string
  error?: string
  rows?: number
  maxlength?: number
  disabled?: boolean
  required?: boolean
}>(), {
  rows: 4,
  disabled: false,
  required: false,
})

const model = defineModel<string>({ default: '' })
const generatedId = useId()
const textareaId = computed(() => props.id ?? `textarea-${generatedId}`)
const errorId = computed(() => `${textareaId.value}-error`)
const hintId = computed(() => `${textareaId.value}-hint`)
const descriptionId = computed(() => props.error
  ? errorId.value
  : props.hint
    ? hintId.value
    : undefined)
</script>

<style scoped lang="scss">
.base-textarea {
  display: grid;
  gap: $space-2;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__field {
    @include field-base;
    resize: vertical;
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
