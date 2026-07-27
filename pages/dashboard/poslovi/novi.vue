<template>
  <div class="job-editor-page">
    <header><div><h1>{{ t('owner.job.newTitle') }}</h1><p>{{ t('owner.job.newDescription') }}</p></div><DemoBadge v-if="isMockMode" type="listing" /></header>
    <BaseAlert v-if="actionError" variant="error">{{ t('common.actionError') }}</BaseAlert>
    <JobWizard v-model="form" :cities="cityOptions" :save-status="saveStatus" :invalid-steps="invalidSteps" :loading="publishing" @save="saveDraft" @publish="publish" />
  </div>
</template>

<script setup lang="ts">
import { createJobSchema } from '~/schemas/validation'
import { createAutosaveController } from '~/services/autosave/autosaveController'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { emptyJobForm, formToJobInput, invalidJobSteps } from '~/utils/jobForm'
import { getOwnerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role', 'profile-complete', 'subscription'], roles: ['owner'], requiresCompletedProfile: true, subscriptionCapability: 'publish_jobs' })
defineI18nRoute({ paths: { hr: '/dashboard/poslovi/novi', en: '/dashboard/jobs/new', sl: '/nadzorna-plosca/dela/novo' } })
const { t, locale } = useI18n()
const isMockMode = useRuntimeConfig().public.infrastructureMode === 'mock'
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const userStore = useUserStore()
await userStore.loadDirectory()
const form = ref(emptyJobForm())
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const invalidSteps = ref<number[]>([])
const draftId = ref<string | null>(null)
const ready = ref(false)
const publishing = ref(false)
const actionError = ref(false)
const cityOptions = computed(() => userStore.cities.map((city) => ({ value: city.code, label: city.name })))
const persistDraft = async () => {
  if (!authStore.user) return
  const job = draftId.value
    ? await jobsStore.updateJob({ id: draftId.value, ...form.value, status: 'draft' })
    : await jobsStore.createJob(formToJobInput(form.value, authStore.user.id, 'draft'))
  draftId.value = job.id
}
const autosave = createAutosaveController(persistDraft, (status) => saveStatus.value = status)
watch(form, () => {
  if (ready.value) autosave.markDirty()
}, { deep: true })
const saveDraft = () => autosave.saveNow()
const publish = async () => {
  if (publishing.value) return
  actionError.value = false
  const result = createJobSchema(t).safeParse(form.value)
  invalidSteps.value = invalidJobSteps(form.value)
  if (!result.success || invalidSteps.value.length) return
  publishing.value = true
  try {
    await saveDraft()
    if (!draftId.value) return
    await jobsStore.transitionJob(draftId.value, 'published')
    await navigateTo(getOwnerJobRoute(draftId.value, locale.value))
  }
  catch {
    actionError.value = true
  }
  finally {
    publishing.value = false
  }
}
onMounted(() => {
  ready.value = true
  autosave.start()
})
onBeforeUnmount(() => autosave.stop())
useSeoMeta({ title: () => t('owner.job.newMetaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.job-editor-page { display: grid; gap: $space-6; > header { display: flex; gap: $space-4; justify-content: space-between; h1 { font-size: $font-size-3xl; } p { margin-top: $space-2; color: $color-text-secondary; } } }
</style>
