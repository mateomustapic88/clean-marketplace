import type { JobActivity, JobActivityType } from '~/domains/jobs/types'

export const createJobActivity = (
  jobId: string,
  type: JobActivityType,
  actorUserId: string | null,
  metadata?: Record<string, string | number>,
  occurredAt = new Date().toISOString(),
): JobActivity => ({
  id: `activity-${crypto.randomUUID()}`,
  jobId,
  actorUserId,
  type,
  occurredAt,
  ...(metadata ? { metadata } : {}),
  isDemo: true,
})
