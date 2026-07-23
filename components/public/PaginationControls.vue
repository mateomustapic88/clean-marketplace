<template>
  <BasePagination v-model="model" :total-pages="totalPages" :label="label" />
</template>

<script setup lang="ts">
defineProps<{ totalPages: number, label: string }>()
const model = defineModel<number>({ default: 1 })
</script>
