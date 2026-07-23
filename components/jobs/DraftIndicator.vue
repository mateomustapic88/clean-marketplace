<template>
  <AutosaveIndicator :status="status" />
</template>

<script setup lang="ts">
defineProps<{ status: 'saved' | 'saving' | 'unsaved' }>()
</script>
