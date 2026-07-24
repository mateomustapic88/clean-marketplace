<template>
  <ol class="wizard-stepper" :aria-label="label">
    <li
      v-for="(step, index) in steps"
      :key="step"
      class="wizard-stepper__item"
      :class="{
        'wizard-stepper__item--active': index === current,
        'wizard-stepper__item--complete': index < current,
        'wizard-stepper__item--invalid': safeInvalidSteps.includes(index),
      }"
    >
      <button
        class="wizard-stepper__button"
        type="button"
        :aria-current="index === current ? 'step' : undefined"
        @click="$emit('select', index)"
      >
        <span class="wizard-stepper__number">{{ index + 1 }}</span>
        <span class="wizard-stepper__label">{{ step }}</span>
      </button>
    </li>
  </ol>
</template>

<script setup lang="ts">
const props = defineProps<{ steps: string[], current: number, label: string, invalidSteps?: number[] }>()
defineEmits<{ select: [index: number] }>()
const safeInvalidSteps = computed(() => props.invalidSteps ?? [])
</script>

<style scoped lang="scss">
.wizard-stepper {
  display: flex;
  gap: $space-2;
  padding: 0 0 $space-5;
  overflow-x: auto;
  list-style: none;
  scrollbar-width: thin;

  &__item {
    position: relative;
    flex: 0 0 auto;
  }

  &__button {
    display: flex;
    gap: $space-2;
    align-items: center;
    min-height: 2.75rem;
    padding: $space-2 $space-3;
    font: inherit;
    color: $color-text-secondary;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: $radius-md;

    &:hover {
      color: $color-primary-dark;
      background: $color-primary-light;
    }

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__number {
    display: grid;
    flex: 0 0 2rem;
    width: 2rem;
    height: 2rem;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    place-items: center;
    border: 1px solid $color-border-strong;
    border-radius: $radius-full;
  }

  &__label {
    min-width: max-content;
  }

  &__item--active &__button {
    font-weight: $font-weight-bold;
    color: $color-primary-dark;
    background: $color-primary-light;
  }

  &__item--active &__number,
  &__item--complete &__number {
    color: $color-surface;
    background: $color-primary;
    border-color: $color-primary;
  }

  &__item--invalid &__number {
    color: $color-error;
    background: $color-error-light;
    border-color: $color-error;
  }
}

@media (max-width: $breakpoint-sm) {
  .wizard-stepper {
    width: calc(100vw - 2rem);
    margin-inline: calc($space-4 * -1);
    padding-inline: $space-4;
  }
}
</style>
