<template>
  <form class="cleaner-filters" @submit.prevent>
    <h2>{{ t('cleaners.filters.title') }}</h2>
    <BaseInput v-model="search" type="search" :label="t('catalog.search')" />
    <BaseSelect
      v-model="city"
      :label="t('catalog.city')"
      :placeholder="t('catalog.allCities')"
      :options="cityOptions"
    />
    <BaseInput v-model.number="maximumRate" type="number" min="0" :label="t('cleaners.filters.maximumRate')" />
    <BaseInput v-model.number="maximumMinimumPrice" type="number" min="0" :label="t('cleaners.filters.maximumMinimum')" />
    <BaseSelect
      v-model="ratingValue"
      :label="t('cleaners.filters.rating')"
      :placeholder="t('catalog.allOptions')"
      :options="ratingOptions"
    />
    <BaseSelect
      v-model="language"
      :label="t('cleaners.filters.language')"
      :placeholder="t('catalog.allOptions')"
      :options="languageOptions"
    />
    <BaseCheckbox v-model="weekend" :label="t('cleaners.filters.weekend')" />
    <BaseCheckbox v-model="sameDay" :label="t('cleaners.filters.sameDay')" />
    <BaseCheckbox v-model="supplies" :label="t('cleaners.filters.supplies')" />
    <BaseCheckbox v-model="transportation" :label="t('cleaners.filters.transport')" />
    <BaseButton block variant="ghost" @click="$emit('reset')">
      {{ t('catalog.resetFilters') }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import type { PublicCleanerFilters } from '~/utils/publicCatalog'

defineProps<{ cityOptions: Array<{ label: string, value: string }> }>()
defineEmits<{ reset: [] }>()
const model = defineModel<PublicCleanerFilters>({ required: true })
const { t } = useI18n()
const filterModel = <Key extends keyof PublicCleanerFilters>(key: Key) => computed({
  get: () => model.value[key],
  set: value => model.value = { ...model.value, [key]: value },
})
const search = filterModel('search')
const city = filterModel('city')
const maximumRate = filterModel('maximumRate')
const maximumMinimumPrice = filterModel('maximumMinimumPrice')
const weekend = filterModel('weekend')
const sameDay = filterModel('sameDay')
const supplies = filterModel('supplies')
const transportation = filterModel('transportation')
const language = filterModel('language')
const ratingValue = computed({
  get: () => model.value.minimumRating === null ? '' : String(model.value.minimumRating),
  set: value => model.value = {
    ...model.value,
    minimumRating: value ? Number(value) : null,
  },
})
const ratingOptions = computed(() => [3, 4, 4.5].map(value => ({
  label: t('cleaners.filters.ratingValue', { value }),
  value: String(value),
})))
const languageOptions = computed(() => ['hr', 'en', 'de', 'it'].map(value => ({
  label: t(`languages.${value}`),
  value,
})))
</script>

<style scoped lang="scss">
.cleaner-filters {
  display: grid;
  gap: $space-4;

  h2 {
    font-size: $font-size-lg;
  }
}
</style>
