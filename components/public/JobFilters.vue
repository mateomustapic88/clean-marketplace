<template>
  <form class="job-filters" @submit.prevent>
    <h2>{{ t('jobs.filters.title') }}</h2>
    <BaseInput v-model="search" type="search" :label="t('catalog.search')" />
    <BaseSelect
      v-model="city"
      :label="t('catalog.city')"
      :placeholder="t('catalog.allCities')"
      :options="cityOptions"
    />
    <BaseInput v-model="date" type="date" :label="t('jobs.filters.date')" />
    <BaseSelect
      v-model="priceType"
      :label="t('jobs.filters.priceType')"
      :placeholder="t('catalog.allOptions')"
      :options="priceOptions"
    />
    <div class="job-filters__row">
      <BaseInput v-model.number="minimumPrice" type="number" min="0" :label="t('catalog.priceMin')" />
      <BaseInput v-model.number="maximumPrice" type="number" min="0" :label="t('catalog.priceMax')" />
    </div>
    <BaseInput v-model.number="minimumSize" type="number" min="0" :label="t('jobs.filters.minimumSize')" />
    <BaseCheckbox v-model="sameDay" :label="t('jobs.filters.sameDay')" />
    <BaseCheckbox v-model="supplies" :label="t('jobs.filters.supplies')" />
    <BaseCheckbox v-model="weekend" :label="t('jobs.filters.weekend')" />
    <BaseCheckbox v-model="urgent" :label="t('jobs.filters.urgent')" />
    <BaseButton block variant="ghost" @click="$emit('reset')">
      {{ t('catalog.resetFilters') }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import type { PublicJobFilters } from '~/utils/publicCatalog'

defineProps<{ cityOptions: Array<{ label: string, value: string }> }>()
defineEmits<{ reset: [] }>()
const model = defineModel<PublicJobFilters>({ required: true })
const { t } = useI18n()
const filterModel = <Key extends keyof PublicJobFilters>(key: Key) => computed({
  get: () => model.value[key],
  set: value => model.value = { ...model.value, [key]: value },
})
const search = filterModel('search')
const city = filterModel('city')
const date = filterModel('date')
const priceType = filterModel('priceType')
const minimumPrice = filterModel('minimumPrice')
const maximumPrice = filterModel('maximumPrice')
const minimumSize = filterModel('minimumSize')
const sameDay = filterModel('sameDay')
const supplies = filterModel('supplies')
const weekend = filterModel('weekend')
const urgent = filterModel('urgent')
const priceOptions = computed(() => [
  { label: t('jobs.budgetType.fixed'), value: 'fixed' },
  { label: t('jobs.budgetType.hourly'), value: 'hourly' },
])
</script>

<style scoped lang="scss">
.job-filters {
  display: grid;
  gap: $space-4;

  h2 {
    font-size: $font-size-lg;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-3;
  }
}
</style>
