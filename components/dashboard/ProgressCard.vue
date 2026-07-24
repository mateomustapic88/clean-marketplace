<template>
  <BaseCard class="progress-card">
    <div><strong>{{ title }}</strong><span>{{ value }}%</span></div>
    <progress :value="value" max="100">{{ value }}%</progress>
    <p>{{ description }}</p>
    <BaseButton v-if="to" size="sm" variant="secondary" :to="to">{{ action }}</BaseButton>
  </BaseCard>
</template>

<script setup lang="ts">
defineProps<{ title: string, description: string, value: number, to?: string, action?: string }>()
</script>

<style scoped lang="scss">
.progress-card {
  min-width: 0;
  display: grid;
  gap: $space-4;
  div { display: flex; flex-wrap: wrap; gap: $space-2; justify-content: space-between; }
  progress { width: 100%; accent-color: $color-primary; }
  p { color: $color-text-secondary; }
}
</style>
