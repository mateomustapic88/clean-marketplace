import type { AnalyticsEvent, AnalyticsProvider } from '~/domains/analytics/types'

export class NoopAnalyticsProvider implements AnalyticsProvider {
  identify(_userId: string, _traits?: Record<string, boolean | number | string | null>): void {}

  page(_path: string, _title?: string): void {}

  track(_event: AnalyticsEvent): void {}

  reset(): void {}
}
