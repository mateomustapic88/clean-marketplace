<template>
  <BaseEmptyState
    :title="t('catalog.emptyTitle')"
    :description="t('catalog.emptyDescription')"
  >
    <template #action>
      <BaseButton variant="secondary" @click="$emit('reset')">
        {{ t('catalog.resetFilters') }}
      </BaseButton>
    </template>
  </BaseEmptyState>
</template>

<script setup lang="ts">
defineEmits<{ reset: [] }>()
const { t } = useI18n()
</script>
