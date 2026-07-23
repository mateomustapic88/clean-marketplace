<template>
  <header class="section-header" :class="{ 'section-header--left': align === 'left' }">
    <p v-if="eyebrow" class="section-header__eyebrow">{{ eyebrow }}</p>
    <h2 class="section-header__title">{{ title }}</h2>
    <p v-if="description" class="section-header__description">{{ description }}</p>
  </header>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
}>(), {
  eyebrow: '',
  description: '',
  align: 'center',
})
</script>

<style scoped lang="scss">
.section-header {
  max-width: 46rem;
  margin-inline: auto;
  text-align: center;

  &--left {
    margin-inline: 0;
    text-align: left;
  }

  &__eyebrow {
    margin-bottom: $space-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  &__title {
    font-size: $font-size-2xl;
    line-height: $line-height-tight;
  }

  &__description {
    margin-top: $space-4;
    color: $color-text-secondary;
  }
}
</style>
