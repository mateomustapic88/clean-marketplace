<template>
  <div v-if="items.length" class="active-filter-chips" :aria-label="t('catalog.activeFilters')">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      @click="$emit('remove', item.key)"
    >
      {{ item.label }}
      <X :size="14" aria-hidden="true" />
    </button>
    <button class="active-filter-chips__clear" type="button" @click="$emit('clear')">
      {{ t('catalog.clearAll') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'
defineProps<{ items: Array<{ key: string, label: string }> }>()
defineEmits<{ remove: [key: string], clear: [] }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.active-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    display: inline-flex;
    gap: $space-1;
    align-items: center;
    min-height: 2.25rem;
    padding: $space-1 $space-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-primary-dark;
    cursor: pointer;
    background: $color-primary-light;
    border: 1px solid rgba($color-primary, 0.2);
    border-radius: $radius-full;
  }

  &__clear {
    background: $color-surface !important;
  }
}
</style>
