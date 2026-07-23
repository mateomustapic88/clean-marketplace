<template>
  <nav v-if="totalPages > 1" class="base-pagination" :aria-label="label">
    <button
      class="base-pagination__button"
      type="button"
      :disabled="model <= 1"
      :aria-label="t('common.previous')"
      @click="model -= 1"
    >
      <ChevronLeft :size="18" aria-hidden="true" />
    </button>
    <button
      v-for="page in pages"
      :key="page"
      class="base-pagination__button"
      :class="{ 'base-pagination__button--active': page === model }"
      type="button"
      :aria-label="t('common.page', { page })"
      :aria-current="page === model ? 'page' : undefined"
      @click="model = page"
    >
      {{ page }}
    </button>
    <button
      class="base-pagination__button"
      type="button"
      :disabled="model >= totalPages"
      :aria-label="t('common.next')"
      @click="model += 1"
    >
      <ChevronRight :size="18" aria-hidden="true" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = withDefaults(defineProps<{
  totalPages: number
  label: string
  siblingCount?: number
}>(), {
  siblingCount: 1,
})

const model = defineModel<number>({ default: 1 })
const { t } = useI18n()
const pages = computed(() => {
  const start = Math.max(1, model.value - props.siblingCount)
  const end = Math.min(props.totalPages, model.value + props.siblingCount)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})
</script>

<style scoped lang="scss">
.base-pagination {
  display: flex;
  gap: $space-2;
  align-items: center;
  justify-content: center;

  &__button {
    display: grid;
    min-width: 2.75rem;
    height: 2.75rem;
    padding: $space-2;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    cursor: pointer;
    place-items: center;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-md;

    &:hover:not(:disabled) {
      color: $color-primary;
      border-color: $color-primary;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    &--active {
      color: $color-surface;
      background: $color-primary;
      border-color: $color-primary;
    }
  }
}
</style>
