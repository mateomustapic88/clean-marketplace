<template>
  <ol class="wizard-stepper" :aria-label="label">
    <li v-for="(step, index) in steps" :key="step" :class="{ 'wizard-stepper__item--active': index === current, 'wizard-stepper__item--complete': index < current, 'wizard-stepper__item--invalid': safeInvalidSteps.includes(index) }">
      <button type="button" :aria-current="index === current ? 'step' : undefined" @click="$emit('select', index)"><span>{{ index + 1 }}</span>{{ step }}</button>
    </li>
  </ol>
</template>

<script setup lang="ts">
const props = defineProps<{ steps: string[], current: number, label: string, invalidSteps?: number[] }>()
defineEmits<{ select: [index: number] }>()
const safeInvalidSteps = computed(() => props.invalidSteps ?? [])
</script>

<style scoped lang="scss">
.wizard-stepper { display: flex; gap: $space-2; padding: 0 0 $space-5; overflow-x: auto; list-style: none;
  &__item button { display: flex; gap: $space-2; align-items: center; min-width: max-content; padding: $space-2; color: $color-text-secondary; background: transparent; border: 0; }
  &__item span { display: grid; width: 1.75rem; height: 1.75rem; place-items: center; border: 1px solid $color-border-strong; border-radius: 50%; }
  &__item--active button { color: $color-primary; font-weight: $font-weight-bold; }
  &__item--active span, &__item--complete span { color: $color-surface; background: $color-primary; border-color: $color-primary; }
  &__item--invalid span { border-color: $color-error; }
}
</style>
