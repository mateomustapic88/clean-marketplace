<template>
  <form class="offer-editor" novalidate @submit.prevent="submit">
    <div class="offer-editor__grid">
      <BaseInput v-model.number="model.proposedPrice" type="number" required :label="t('cleaner.offer.fields.price')" :error="errors.proposedPrice ?? ''" />
      <BaseSelect v-model="model.priceType" required :label="t('cleaner.offer.fields.priceType')" :options="priceTypes" />
      <BaseInput v-model.number="model.estimatedDurationHours" type="number" required :label="t('cleaner.offer.fields.duration')" :error="errors.estimatedDurationHours ?? ''" />
      <BaseInput v-model="model.availableArrivalTime" type="time" required :label="t('cleaner.offer.fields.arrival')" :error="errors.availableArrivalTime ?? ''" />
      <BaseInput v-model="model.expiresAt" type="datetime-local" required :label="t('cleaner.offer.fields.validUntil')" :error="errors.expiresAt ?? ''" />
    </div>
    <BaseTextarea v-model="model.message" required :label="t('cleaner.offer.fields.message')" :error="errors.message ?? ''" />
    <BaseCheckbox v-model="model.suppliesIncluded" :label="t('cleaner.offer.fields.supplies')" />
    <BaseAlert v-if="errorMessage" variant="error">{{ errorMessage }}</BaseAlert>
    <div class="offer-editor__actions">
      <BaseButton type="submit" :loading="loading">{{ submitLabel }}</BaseButton>
      <BaseButton v-if="withdrawable" type="button" variant="danger" :disabled="loading" @click="$emit('withdraw')">{{ t('cleaner.offer.withdraw') }}</BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { OfferFormData } from '~/schemas/validation'
import { createOfferSchema } from '~/schemas/validation'
import { getFieldErrors } from '~/utils/validation'

const props = withDefaults(defineProps<{ submitLabel: string, withdrawable?: boolean, errorMessage?: string, loading?: boolean }>(), { withdrawable: false, errorMessage: '', loading: false })
const emit = defineEmits<{ submit: [value: OfferFormData], withdraw: [] }>()
const model = defineModel<OfferFormData>({ required: true })
const { t } = useI18n()
const errors = ref<Record<string, string>>({})
const priceTypes = computed(() => ['fixed', 'hourly'].map((value) => ({ value, label: t(`jobs.budgetType.${value}`) })))
const submit = () => {
  if (props.loading) return
  const result = createOfferSchema(t).safeParse(model.value)
  if (!result.success) {
    errors.value = getFieldErrors(result.error)
    return
  }
  errors.value = {}
  emit('submit', result.data)
}
</script>

<style scoped lang="scss">
.offer-editor { display: grid; gap: $space-5; &__grid { display: grid; gap: $space-4; } &__actions { display: flex; flex-wrap: wrap; gap: $space-3; } @media (min-width: $breakpoint-md) { &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>
