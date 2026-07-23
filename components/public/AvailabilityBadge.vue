<template>
  <span class="availability-badge" :class="`availability-badge--${active ? 'yes' : 'no'}`">
    <Check v-if="active" :size="14" aria-hidden="true" />
    <X v-else :size="14" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { Check, X } from '@lucide/vue'
defineProps<{ active: boolean, label: string }>()
</script>

<style scoped lang="scss">
.availability-badge {
  display: inline-flex;
  gap: $space-1;
  align-items: center;
  padding: $space-1 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: $radius-full;

  &--yes {
    color: $color-success;
    background: $color-success-light;
  }

  &--no {
    color: $color-text-secondary;
    background: $color-background;
  }
}
</style>
