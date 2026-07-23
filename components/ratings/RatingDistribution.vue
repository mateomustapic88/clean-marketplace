<template>
  <div class="rating-distribution">
    <div v-for="score in [5, 4, 3, 2, 1]" :key="score"><span>{{ score }}</span><progress :value="distribution[score as keyof typeof distribution]" :max="total || 1" /><span>{{ distribution[score as keyof typeof distribution] }}</span></div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ distribution: Record<1 | 2 | 3 | 4 | 5, number> }>()
const total = computed(() => Object.values(props.distribution).reduce((sum, value) => sum + value, 0))
</script>

<style scoped lang="scss">
.rating-distribution { display: grid; gap: $space-2; div { display: grid; grid-template-columns: 1rem 1fr 2rem; gap: $space-3; align-items: center; } progress { width: 100%; accent-color: $color-accent; } }
</style>
