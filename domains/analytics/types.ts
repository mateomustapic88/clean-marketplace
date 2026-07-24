export interface AnalyticsEvent {
  name: string
  properties?: Record<string, boolean | number | string | null>
}

export interface AnalyticsProvider {
  identify(userId: string, traits?: Record<string, boolean | number | string | null>): void
  page(path: string, title?: string): void
  track(event: AnalyticsEvent): void
  reset(): void
}
