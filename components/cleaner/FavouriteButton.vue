<template>
  <BaseButton size="sm" :variant="active ? 'secondary' : 'ghost'" :aria-pressed="active" @click="$emit('toggle')"><Heart :size="17" :fill="active ? 'currentColor' : 'none'" />{{ t(active ? 'cleaner.favourites.remove' : 'cleaner.favourites.save') }}</BaseButton>
</template>

<script setup lang="ts">
import { Heart } from '@lucide/vue'

defineProps<{ active: boolean }>()
defineEmits<{ toggle: [] }>()
const { t } = useI18n()
</script>
