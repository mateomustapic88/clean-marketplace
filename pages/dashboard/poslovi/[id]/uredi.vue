<template>
  <div class="job-editor-page">
    <header><div><h1>{{ t('owner.job.editTitle') }}</h1><p>{{ t('owner.job.editDescription') }}</p></div><StatusBadge v-if="job" :status="job.status" /></header>
    <BaseAlert v-if="job && isPublishedJobReadOnly(job.status)" variant="warning">{{ t('owner.job.readOnly') }}</BaseAlert>
    <JobWizard
      v-else-if="job"
      v-model="form"
      :cities="cityOptions"
      :save-status="saveStatus"
      :invalid-steps="invalidSteps"
      :save-label="job.status === 'draft' ? t('owner.job.saveDraft') : t('owner.job.saveChanges')"
      :publish-label="job.status === 'draft' ? t('owner.job.publish') : t('owner.jobs.republish')"
      @save="saveDraft"
      @publish="publish"
    />
    <BaseEmptyState v-else :title="t('jobDetail.notFound')" :description="t('jobDetail.notFoundDescription')" />
  </div>
</template>

<script setup lang="ts">
import { createJobSchema } from '~/schemas/validation'
import { createAutosaveController } from '~/services/autosave/autosaveController'
import { isPublishedJobReadOnly } from '~/services/jobs/jobLifecycle'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { emptyJobForm, invalidJobSteps, jobToForm } from '~/utils/jobForm'
import { getOwnerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/poslovi/[id]/uredi', en: '/dashboard/jobs/[id]/edit' } })
const route = useRoute()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const userStore = useUserStore()
await Promise.all([jobsStore.loadJob(String(route.params.id)), userStore.loadDirectory()])
const job = computed(() => jobsStore.selectedJob?.ownerId === authStore.user?.id ? jobsStore.selectedJob : null)
const form = ref(job.value ? jobToForm(job.value) : emptyJobForm())
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const invalidSteps = ref<number[]>([])
const cityOptions = computed(() => userStore.cities.map((city) => ({ value: city.code, label: city.name })))
watch(job, (value) => {
  if (value) form.value = jobToForm(value)
}, { immediate: true })
let ready = false
const persistDraft = async () => {
  if (job.value) {
    await jobsStore.updateJob({ id: job.value.id, ...form.value })
  }
}
const autosave = createAutosaveController(persistDraft, (status) => saveStatus.value = status)
watch(form, () => {
  if (ready) autosave.markDirty()
}, { deep: true })
const saveDraft = () => autosave.saveNow()
const publish = async () => {
  const result = createJobSchema(t).safeParse(form.value)
  invalidSteps.value = invalidJobSteps(form.value)
  if (!result.success || invalidSteps.value.length || !job.value) return
  await saveDraft()
  await jobsStore.transitionJob(job.value.id, 'published')
  await navigateTo(getOwnerJobRoute(job.value.id, locale.value))
}
onMounted(() => {
  ready = true
  autosave.start()
})
onBeforeUnmount(() => autosave.stop())
useSeoMeta({ title: () => t('owner.job.editMetaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.job-editor-page { display: grid; gap: $space-6; > header { display: flex; gap: $space-4; justify-content: space-between; h1 { font-size: $font-size-3xl; } p { margin-top: $space-2; color: $color-text-secondary; } } }
</style>
