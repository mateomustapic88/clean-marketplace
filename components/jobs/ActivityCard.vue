<template>
  <article class="activity-card">
    <span aria-hidden="true"><component :is="icon" :size="17" /></span>
    <div class="activity-card__content"><strong>{{ t(`owner.activity.${activity.type}`, activity.metadata ?? {}) }}</strong><time :datetime="activity.occurredAt">{{ formatPublicDate(activity.occurredAt.slice(0, 10), locale) }}</time></div>
    <DemoBadge v-if="activity.isDemo" class="activity-card__badge" type="listing" />
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
.activity-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) max-content;
  gap: $space-2 $space-3;
  align-items: start;
  padding-block: $space-4;
  border-bottom: 1px solid $color-border;

  > span {
    display: grid;
    width: 2rem;
    height: 2rem;
    color: $color-primary;
    place-items: center;
    background: $color-primary-light;
    border-radius: $radius-full;
  }

  &__content {
    display: grid;
    min-width: 0;
    gap: $space-1;

    strong {
      overflow-wrap: anywhere;
    }
  }

  &__badge {
    grid-column: 3;
    grid-row: 1;
    align-self: center;
    justify-self: end;
    white-space: nowrap;
  }

  time {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  @media (max-width: 24rem) {
    grid-template-columns: auto minmax(0, 1fr);

    &__badge {
      grid-row: 2;
      grid-column: 2;
      justify-self: start;
    }
  }
}
</style>
