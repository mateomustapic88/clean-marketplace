<template>
  <div class="cleaner-availability">
    <BaseCheckbox v-model="vacation" :label="t('cleaner.availability.vacation')" />
    <div class="cleaner-availability__week">
      <BaseCard v-for="day in model" :key="day.weekday">
        <h3>{{ dayNames[day.weekday] }}</h3>
        <BaseSelect :model-value="slotFor(day)" :label="t('cleaner.availability.period')" :options="periodOptions" @update:model-value="setSlot(day, String($event))" />
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Availability } from '~/domains/shared/types'

const model = defineModel<Availability[]>({ required: true })
const vacation = defineModel<boolean>('vacation', { required: true })
const { t } = useI18n()
const dayNames = computed(() => Array.from({ length: 7 }, (_, weekday) => t(`cleaner.availability.days.${weekday}`)))
const periodOptions = computed(() => ['morning', 'afternoon', 'evening', 'unavailable'].map((value) => ({ value, label: t(`cleaner.availability.periods.${value}`) })))
const slots = {
  morning: { start: '07:00', end: '12:00' },
  afternoon: { start: '12:00', end: '17:00' },
  evening: { start: '17:00', end: '21:00' },
} as const
const slotFor = (day: Availability) => {
  if (!day.enabled || !day.ranges[0]) return 'unavailable'
  return Object.entries(slots).find(([, range]) => range.start === day.ranges[0]?.start)?.[0] ?? 'morning'
}
const setSlot = (day: Availability, slot: string) => {
  if (slot === 'unavailable') {
    day.enabled = false
    day.ranges = []
    return
  }
  day.enabled = true
  day.ranges = [{ ...slots[slot as keyof typeof slots] }]
}
</script>

<style scoped lang="scss">
.cleaner-availability { display: grid; gap: $space-5; &__week { display: grid; gap: $space-4; } :deep(.base-card) { display: grid; gap: $space-3; } @media (min-width: $breakpoint-md) { &__week { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (min-width: $breakpoint-xl) { &__week { grid-template-columns: repeat(4, minmax(0, 1fr)); } } }
</style>
