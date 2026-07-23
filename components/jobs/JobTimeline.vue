<template>
  <div class="job-timeline"><ActivityCard v-for="activity in activities" :key="activity.id" :activity="activity" /></div>
</template>

<script setup lang="ts">
import type { JobActivity } from '~/domains/jobs/types'

defineProps<{ activities: JobActivity[] }>()
</script>
