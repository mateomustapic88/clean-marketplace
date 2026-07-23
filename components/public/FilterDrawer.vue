<template>
  <BaseDrawer v-model="model" :title="title">
    <slot />
  </BaseDrawer>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
const model = defineModel<boolean>({ default: false })
</script>
