<template>
  <header class="page-hero">
    <div class="container">
      <Breadcrumbs v-if="breadcrumbs.length" :items="breadcrumbs" />
      <p>{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <span>{{ description }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
withDefaults(defineProps<{
  eyebrow: string
  title: string
  description: string
  breadcrumbs?: Array<{ label: string, to?: RouteLocationRaw }>
}>(), { breadcrumbs: () => [] })
</script>

<style scoped lang="scss">
.page-hero {
  padding-block: $space-16;
  text-align: center;
  background: linear-gradient(145deg, $color-background, $color-primary-light);
  border-bottom: 1px solid $color-border;

  p {
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  h1 {
    max-width: 52rem;
    margin: $space-3 auto $space-5;
    font-size: $font-size-3xl;
  }

  span {
    display: block;
    max-width: 44rem;
    margin-inline: auto;
    color: $color-text-secondary;
  }
}
</style>
