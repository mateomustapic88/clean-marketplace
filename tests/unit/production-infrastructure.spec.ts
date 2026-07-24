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
})
