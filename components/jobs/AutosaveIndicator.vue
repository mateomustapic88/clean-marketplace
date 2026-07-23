<template>
  <span class="autosave-indicator" role="status"><Cloud :size="16" aria-hidden="true" />{{ t(`owner.autosave.${status}`) }}</span>
</template>

<script setup lang="ts">
import { Cloud } from '@lucide/vue'

defineProps<{ status: 'saved' | 'saving' | 'unsaved' }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.autosave-indicator { display: inline-flex; gap: $space-2; align-items: center; font-size: $font-size-sm; color: $color-text-secondary; }
</style>
