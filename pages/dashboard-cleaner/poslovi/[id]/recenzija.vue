<template>
  <ReviewPage :job-id="jobId" role="cleaner" :back-to="getCleanerJobRoute(jobId, locale)" />
</template>

<script setup lang="ts">
import { getCleanerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/poslovi/[id]/recenzija', en: '/dashboard-cleaner/jobs/[id]/review', sl: '/nadzorna-plosca-cistilec/dela/[id]/ocena' } })
const route = useRoute()
const { locale, t } = useI18n()
const jobId = String(route.params.id)
useSeoMeta({ title: () => t('reviews.metaTitle'), robots: 'noindex, nofollow' })
</script>
