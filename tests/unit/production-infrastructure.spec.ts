import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  productionCanonicalUrl,
  resolveAppBaseUrl,
  resolveInfrastructureMode,
} from '~/config/infrastructure'

const migrationsDirectory = new URL('../../supabase/migrations/', import.meta.url)
const migrationFiles = readdirSync(migrationsDirectory).sort()
const migrationSql = migrationFiles.map((file) =>
  readFileSync(new URL(file, migrationsDirectory), 'utf8'),
).join('\n')
const providerEntitlementMigrationSql = readFileSync(
  new URL('0018_provider_backed_entitlements.sql', migrationsDirectory),
  'utf8',
)
const publicCleanerVisibilityMigrationSql = readFileSync(
  new URL('0020_hide_incomplete_cleaner_profiles.sql', migrationsDirectory),
  'utf8',
)
const completedProfileActionsMigrationSql = readFileSync(
  new URL('0021_require_completed_profiles_for_marketplace_actions.sql', migrationsDirectory),
  'utf8',
)

describe('production infrastructure', () => {
  it('uses the approved canonical domain and rejects unsafe infrastructure modes', () => {
    expect(productionCanonicalUrl).toBe('https://clean-marketplace.com')
    expect(resolveAppBaseUrl('https://clean-marketplace.com/', true)).toBe(productionCanonicalUrl)
    expect(() => resolveAppBaseUrl('not-a-url', true)).toThrow()
    expect(resolveInfrastructureMode(undefined, true, false)).toBe('supabase')
    expect(resolveInfrastructureMode(undefined, false, true)).toBe('supabase')
    expect(resolveInfrastructureMode('mock', false, true)).toBe('mock')
    expect(() => resolveInfrastructureMode('mock', true, true)).toThrow()
  })

  it('contains the complete ordered migration sequence', () => {
    expect(migrationFiles).toEqual([
      '0001_extensions_enums_helpers.sql',
      '0002_identity_profiles.sql',
      '0003_marketplace_schema.sql',
      '0004_reviews_notifications.sql',
      '0005_billing_feedback_audit.sql',
      '0006_indexes_triggers.sql',
      '0007_rls_helpers.sql',
      '0008_profile_rls.sql',
      '0009_marketplace_rls.sql',
      '0010_billing_feedback_rls.sql',
      '0011_transactional_functions.sql',
      '0012_storage_buckets_policies.sql',
      '0013_safe_marketplace_views.sql',
      '0014_rls_verification.sql',
      '0015_subscription_billing_period.sql',
      '0016_add_slovenian_locale.sql',
      '0017_ranked_marketplace_search.sql',
      '0018_provider_backed_entitlements.sql',
      '0019_add_makarska_city.sql',
      '0020_hide_incomplete_cleaner_profiles.sql',
      '0021_require_completed_profiles_for_marketplace_actions.sql',
    ])
  })

  it('enables RLS for every application table and protects privileged writes', () => {
    const tableNames = [...migrationSql.matchAll(/create table public\.([a-z_]+)/g)]
      .map((match) => match[1])
    for (const table of tableNames) {
      expect(migrationSql).toContain(`alter table public.${table} enable row level security`)
    }
    expect(migrationSql).toContain('revoke all on public.stripe_events from anon, authenticated')
    expect(migrationSql).toContain('revoke insert, update, delete on public.subscriptions')
    expect(migrationSql).not.toMatch(/create policy .*stripe_events.*(?:insert|update|delete|all) to authenticated/i)
  })

  it('defines atomic marketplace operations and private Storage buckets', () => {
    expect(migrationSql).toContain('function public.accept_offer')
    expect(migrationSql).toContain('function public.progress_job')
    expect(migrationSql).toContain('function public.create_review')
    expect(migrationSql).toContain("'avatars', 'avatars', false")
    expect(migrationSql).toContain("'job-images', 'job-images', false")
    expect(migrationSql).toContain("set search_path = ''")
  })

  it('persists the Stripe subscription cadence with constrained values', () => {
    expect(migrationSql).toContain("create type public.billing_period as enum ('monthly', 'annual')")
    expect(migrationSql).toContain('billing_period public.billing_period not null')
    expect(migrationSql).toContain("stripe_interval in ('month', 'year')")
  })

  it('requires a provider-backed subscription for database Premium access', () => {
    expect(providerEntitlementMigrationSql).toContain("nullif(btrim(s.stripe_subscription_id), '') is not null")
    expect(providerEntitlementMigrationSql).toContain("s.status = 'past_due'")
    expect(providerEntitlementMigrationSql).toContain('s.grace_period_ends_at')
    expect(providerEntitlementMigrationSql).not.toContain('s.current_period_ends_at is null')
  })

  it('allows crashed Stripe webhook claims to be retried without duplicating live workers', () => {
    const repositorySource = readFileSync(
      new URL('../../repositories/supabase/SupabaseStripeEventRepository.ts', import.meta.url),
      'utf8',
    )
    expect(repositorySource).toContain('STALE_EVENT_CLAIM_MS')
    expect(repositorySource).toContain(".eq('status', 'processing')")
    expect(repositorySource).toContain(".lt('claimed_at', staleBefore)")
  })

  it('uses indexed, RLS-safe ranked marketplace search', () => {
    expect(migrationSql).toContain('create extension if not exists pg_trgm')
    expect(migrationSql).toContain('create extension if not exists unaccent')
    expect(migrationSql).toContain('jobs_search_trgm_idx')
    expect(migrationSql).toContain('jobs_search_fts_idx')
    expect(migrationSql).toContain('profiles_search_trgm_idx')
    expect(migrationSql).toContain('function public.search_marketplace_jobs')
    expect(migrationSql).toContain('function public.search_marketplace_cleaners')
    expect(migrationSql).toContain('security invoker')
    expect(migrationSql).toContain('least(greatest(p_page_size, 1), 100)')
  })

  it('keeps incomplete cleaner profiles out of every public catalog path', () => {
    expect(publicCleanerVisibilityMigrationSql)
      .toContain('p.onboarding_completed')
    expect(publicCleanerVisibilityMigrationSql)
      .toContain('profile.onboarding_completed')
  })

  it('requires completed profiles for protected marketplace writes', () => {
    expect(completedProfileActionsMigrationSql)
      .toContain('public.has_completed_profile')
    expect(completedProfileActionsMigrationSql)
      .toContain('profile.onboarding_completed')
    expect(completedProfileActionsMigrationSql)
      .toContain("public.has_completed_profile('owner')")
    expect(completedProfileActionsMigrationSql)
      .toContain("public.has_completed_profile('cleaner')")
    expect(completedProfileActionsMigrationSql)
      .toContain("status = 'withdrawn'")
  })
})
