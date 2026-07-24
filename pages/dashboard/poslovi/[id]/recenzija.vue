<template>
  <ReviewPage :job-id="jobId" role="owner" :back-to="getOwnerJobRoute(jobId, locale)" />
</template>

<script setup lang="ts">
import { getOwnerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/poslovi/[id]/recenzija', en: '/dashboard/jobs/[id]/review', sl: '/nadzorna-plosca/dela/[id]/ocena' } })
const route = useRoute()
const { locale, t } = useI18n()
const jobId = String(route.params.id)
useSeoMeta({ title: () => t('reviews.metaTitle'), robots: 'noindex, nofollow' })
</script>
