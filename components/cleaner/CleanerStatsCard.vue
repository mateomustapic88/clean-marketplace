<template>
  <BaseCard class="cleaner-stats-card"><component :is="icon" :size="22" /><strong>{{ value }}</strong><span>{{ label }}</span></BaseCard>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon: Component, value: string | number, label: string }>()
</script>

<style scoped lang="scss">
.cleaner-stats-card { display: grid; gap: $space-2; strong { font-size: $font-size-2xl; } span { color: $color-text-secondary; } svg { color: $color-primary; } }
</style>
