<template>
  <BaseCard class="owner-stats-card">
    <component :is="icon" :size="22" aria-hidden="true" />
    <strong>{{ value }}</strong>
    <span>{{ label }}</span>
  </BaseCard>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ label: string, value: string | number, icon: Component }>()
</script>

<style scoped lang="scss">
.owner-stats-card {
  display: grid;
  gap: $space-2;
  svg { color: $color-primary; }
  strong { font-size: $font-size-2xl; }
  span { color: $color-text-secondary; }
}
</style>
