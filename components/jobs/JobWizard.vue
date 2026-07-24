<template>
  <BaseCard class="job-wizard">
    <div class="job-wizard__top">
      <WizardStepper :steps="steps" :current="current" :invalid-steps="invalidSteps" :label="t('owner.job.stepperLabel')" @select="current = $event" />
      <AutosaveIndicator :status="saveStatus" />
    </div>
    <form novalidate @submit.prevent="publish">
      <fieldset v-show="current === 0">
        <legend>{{ steps[0] }}</legend>
        <div class="job-wizard__grid">
          <BaseInput v-model="model.title" required :label="t('owner.job.fields.title')" />
          <BaseInput v-model="model.apartmentName" required :label="t('owner.job.fields.apartmentName')" />
          <BaseSelect v-model="model.cityCode" required :label="t('catalog.city')" :options="cities" />
          <BaseInput v-model="model.approximateArea" required :label="t('owner.job.fields.approximateArea')" />
          <BaseInput v-model="model.address" required :label="t('owner.job.fields.address')" />
          <BaseCheckbox v-model="model.hideExactAddress" :label="t('owner.job.fields.hideAddress')" />
        </div>
      </fieldset>
      <fieldset v-show="current === 1">
        <legend>{{ steps[1] }}</legend>
        <div class="job-wizard__grid">
          <BaseInput v-model.number="model.sizeSquareMeters" type="number" required :label="t('owner.job.fields.size')" />
          <BaseInput v-model.number="model.bedrooms" type="number" required :label="t('owner.job.fields.bedrooms')" />
          <BaseInput v-model.number="model.bathrooms" type="number" required :label="t('owner.job.fields.bathrooms')" />
          <BaseInput v-model.number="model.beds" type="number" required :label="t('owner.job.fields.beds')" />
          <BaseInput v-model.number="model.guestCapacity" type="number" required :label="t('owner.job.fields.guests')" />
          <BaseInput v-model.number="model.estimatedDurationHours" type="number" required :label="t('owner.job.fields.duration')" />
        </div>
      </fieldset>
      <fieldset v-show="current === 2">
        <legend>{{ steps[2] }}</legend>
        <div class="job-wizard__checks">
          <BaseCheckbox v-for="service in serviceKeys" :key="service" v-model="model.services[service]" :label="t(`owner.job.services.${service}`)" />
        </div>
      </fieldset>
      <fieldset v-show="current === 3">
        <legend>{{ steps[3] }}</legend>
        <div class="job-wizard__grid">
          <BaseInput v-model.number="model.proposedBudget" type="number" required :label="t('owner.job.fields.budget')" />
          <BaseSelect v-model="model.budgetType" required :label="t('owner.job.fields.budgetType')" :options="budgetOptions" />
          <BaseCheckbox v-model="model.isUrgent" :label="t('owner.job.fields.urgent')" />
        </div>
      </fieldset>
      <fieldset v-show="current === 4">
        <legend>{{ steps[4] }}</legend>
        <div class="job-wizard__grid">
          <BaseInput v-model="model.preferredDate" type="date" required :label="t('owner.job.fields.date')" />
          <BaseInput v-model="model.preferredStartTime" type="time" required :label="t('owner.job.fields.time')" />
          <BaseInput v-model="model.offerDeadline" type="datetime-local" required :label="t('owner.job.fields.deadline')" />
          <BaseCheckbox v-model="model.flexibleTime" :label="t('owner.job.fields.flexible')" />
        </div>
        <BaseTextarea v-model="model.additionalInstructions" :label="t('owner.job.fields.notes')" />
        <PhotoUploader @update="model.photoUrls = $event" />
      </fieldset>
      <fieldset v-show="current === 5">
        <legend>{{ steps[5] }}</legend>
        <div class="job-wizard__review">
          <h2>{{ model.title || t('owner.job.untitled') }}</h2>
          <p>{{ model.apartmentName }} · {{ cityLabel }}</p>
          <dl>
            <div><dt>{{ t('owner.job.fields.date') }}</dt><dd>{{ model.preferredDate || '-' }} {{ model.preferredStartTime }}</dd></div>
            <div><dt>{{ t('owner.job.fields.budget') }}</dt><dd>{{ model.proposedBudget }} EUR</dd></div>
            <div><dt>{{ t('owner.job.fields.size') }}</dt><dd>{{ model.sizeSquareMeters }} m²</dd></div>
          </dl>
          <BaseAlert v-if="invalidSteps.length" variant="error">{{ t('owner.job.validationError') }}</BaseAlert>
        </div>
      </fieldset>
      <div class="job-wizard__actions">
        <BaseButton type="button" variant="ghost" :disabled="loading" @click="$emit('save')">{{ saveLabel || t('owner.job.saveDraft') }}</BaseButton>
        <span class="job-wizard__spacer" />
        <BaseButton v-if="current > 0" type="button" variant="secondary" :disabled="loading" @click="current--">{{ t('common.previous') }}</BaseButton>
        <BaseButton v-if="current < steps.length - 1" type="button" :disabled="loading" @click="current++">{{ t('common.next') }}</BaseButton>
        <BaseButton v-else type="submit" :loading="loading">{{ publishLabel || t('owner.job.publish') }}</BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script setup lang="ts">
import type { CleaningJobServices } from '~/domains/jobs/types'
import type { JobFormData } from '~/schemas/validation'

const props = withDefaults(defineProps<{
  cities: Array<{ label: string, value: string }>
  saveStatus: 'saved' | 'saving' | 'unsaved'
  invalidSteps?: number[]
  saveLabel?: string
  publishLabel?: string
  loading?: boolean
}>(), {
  invalidSteps: () => [],
  saveLabel: '',
  publishLabel: '',
  loading: false,
})
const emit = defineEmits<{ save: [], publish: [] }>()
const model = defineModel<JobFormData & { photoUrls: string[] }>({ required: true })
const { t } = useI18n()
const current = ref(0)
const steps = computed(() => ['basic', 'apartment', 'requirements', 'budget', 'schedule', 'review'].map((key) => t(`owner.job.steps.${key}`)))
const serviceKeys: Array<keyof CleaningJobServices> = ['cleaningSuppliesProvided', 'linenReplacement', 'towelReplacement', 'laundry', 'balconyCleaning', 'kitchenCleaning', 'fridgeCleaning', 'ovenCleaning', 'windowCleaning', 'sameDayTurnover']
const budgetOptions = computed(() => ['fixed', 'hourly'].map((value) => ({ value, label: t(`jobs.budgetType.${value}`) })))
const cityLabel = computed(() => props.cities.find((city) => city.value === model.value.cityCode)?.label ?? '')
const publish = () => {
  if (!props.loading) emit('publish')
}
</script>

<style scoped lang="scss">
.job-wizard {
  display: grid;
  gap: $space-5;
  &__top { display: grid; gap: $space-3; }
  form, fieldset { display: grid; gap: $space-5; }
  fieldset { padding: 0; border: 0; } legend { margin-bottom: $space-5; font-size: $font-size-xl; font-weight: $font-weight-bold; }
  &__grid, &__checks { display: grid; gap: $space-4; }
  &__review { display: grid; gap: $space-4; } dl { display: grid; gap: $space-2; } dl div { display: flex; justify-content: space-between; }
  &__actions { display: flex; flex-wrap: wrap; gap: $space-3; padding-top: $space-5; border-top: 1px solid $color-border; }
  &__spacer { flex: 1; }
  @media (min-width: $breakpoint-md) { &__grid, &__checks { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
}
</style>
