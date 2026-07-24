<template>
  <div v-if="items.length" class="active-filter-chips" :aria-label="t('catalog.activeFilters')">
    <button
      v-for="item in items"
      :key="item.key"
      class="active-filter-chips__item"
      type="button"
      @click="$emit('remove', item.key)"
    >
      <span>{{ item.label }}</span>
      <X :size="14" stroke-width="2.4" aria-hidden="true" />
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
  gap: $space-2 $space-3;
  align-items: center;

  button {
    appearance: none;
    display: inline-flex;
    gap: $space-2;
    align-items: center;
    justify-content: center;
    width: fit-content;
    min-width: 0;
    min-height: 2rem;
    padding: 0.35rem $space-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    line-height: $line-height-tight;
    color: $color-primary-dark;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: $radius-full;
    transition:
      color $transition-fast,
      background-color $transition-fast,
      border-color $transition-fast,
      box-shadow $transition-fast,
      transform $transition-fast;

    &:hover {
      transform: translateY(-1px);
    }
  }

  &__item {
    background: linear-gradient(180deg, $color-surface 0%, $color-primary-light 100%);
    border-color: rgba($color-primary, 0.24) !important;
    box-shadow: 0 0.35rem 1rem rgba($color-primary-dark, 0.07);

    svg {
      flex: 0 0 auto;
      color: $color-primary;
      transition: transform $transition-fast;
    }

    &:hover {
      background: $color-primary-light;
      border-color: rgba($color-primary, 0.38) !important;
      box-shadow: 0 0.45rem 1.15rem rgba($color-primary-dark, 0.1);
    }

    &:hover svg {
      transform: scale(1.08);
    }
  }

  &__clear {
    color: $color-text-secondary !important;
    background: $color-surface !important;
    border-color: $color-border !important;

    &:hover {
      color: $color-primary-dark !important;
      background: $color-background !important;
      border-color: $color-border-strong !important;
      box-shadow: $shadow-sm;
    }
  }
}
</style>
