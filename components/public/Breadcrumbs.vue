<template>
  <nav class="breadcrumbs" :aria-label="t('catalog.breadcrumbs')">
    <ol>
      <li v-for="(item, index) in items" :key="item.label">
        <NuxtLink v-if="item.to && index < items.length - 1" :to="item.to">{{ item.label }}</NuxtLink>
        <span v-else aria-current="page">{{ item.label }}</span>
        <ChevronRight v-if="index < items.length - 1" :size="14" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'
defineProps<{ items: Array<{ label: string, to?: RouteLocationRaw }> }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.breadcrumbs {
  margin-bottom: $space-6;
  font-size: $font-size-sm;

  ol,
  li {
    display: flex;
    gap: $space-2;
    align-items: center;
  }

  ol {
    flex-wrap: wrap;
    padding: 0;
    list-style: none;
  }

  a {
    color: $color-primary;
  }

  span {
    color: $color-text-secondary;
  }
}
</style>
