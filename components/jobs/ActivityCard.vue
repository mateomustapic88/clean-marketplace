<template>
  <article class="activity-card">
    <span aria-hidden="true"><component :is="icon" :size="17" /></span>
    <div><strong>{{ t(`owner.activity.${activity.type}`, activity.metadata ?? {}) }}</strong><time :datetime="activity.occurredAt">{{ formatPublicDate(activity.occurredAt.slice(0, 10), locale) }}</time></div>
    <DemoBadge type="listing" />
  </article>
</template>

<script setup lang="ts">
import { Check, Clock, Eye, FilePlus2, Save, Send, Tag } from '@lucide/vue'
import type { LucideIcon } from '@lucide/vue'
import type { JobActivity, JobActivityType } from '~/domains/jobs/types'
import { formatPublicDate } from '~/utils/formatters'

const props = defineProps<{ activity: JobActivity }>()
const { t, locale } = useI18n()
const icons: Partial<Record<JobActivityType, LucideIcon>> = {
  created: FilePlus2,
  draft_saved: Save,
  published: Send,
  viewed: Eye,
  offer_received: Tag,
  offer_submitted: Send,
  offer_edited: Save,
  offer_withdrawn: Clock,
  offer_accepted: Check,
  offer_rejected: Clock,
  cleaner_confirmed: Check,
  started: Clock,
  status_changed: Clock,
  completed: Check,
}
const icon = computed(() => icons[props.activity.type] ?? Clock)
</script>

<style scoped lang="scss">
.activity-card { display: grid; grid-template-columns: auto 1fr auto; gap: $space-3; align-items: start; padding-block: $space-4; border-bottom: 1px solid $color-border;
  > span { display: grid; width: 2rem; height: 2rem; color: $color-primary; place-items: center; background: $color-primary-light; border-radius: 50%; }
  div { display: grid; gap: $space-1; } time { font-size: $font-size-xs; color: $color-text-secondary; }
}
</style>
