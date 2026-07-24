# Architecture and phased delivery

## Completed phases

Phase 1 established Nuxt, strict TypeScript, Croatian-first localization, the
SCSS design system, reusable components, and the responsive application shell.

Phase 2 adds:

1. Domain models with a shared `DemoEntity` contract
2. Repository interfaces for authentication, users, jobs, offers, ratings,
   subscriptions, and notifications
3. Local JSON seed data and mock repository implementations
4. Pinia stores that coordinate state through repositories
5. Local authentication persistence and session restoration
6. Guest, authenticated, and role-based route middleware
7. Croatian and English authentication and protected route shells
8. Zod schemas for login, registration, owner profiles, and cleaner profiles

Phase 3 adds the complete public-facing beta experience. Public pages consume
existing Pinia stores, stores coordinate repository calls, and pure catalogue
utilities own filtering, sorting, query serialization, pagination, and display
formatting. Presentational components do not fetch data.

Phase 4 adds the complete apartment-owner experience:

1. A responsive dashboard layout with owner navigation, statistics, profile
   completion, quick actions, and recent or upcoming work
2. Five-step owner onboarding, owner profile editing, avatar preview, and
   account communication settings
3. A six-step job wizard with Zod validation, image preview restrictions,
   draft autosave, and publish flow
4. Owner job card and table views with search, status, city, date, and sorting
   controls
5. Centralized job lifecycle rules for publish, archive, cancel, republish,
   duplicate, and draft deletion
6. Owner-only job details with status, activity timeline, and visible demo
   identifiers
7. Unit and browser coverage for lifecycle rules, session restoration,
   responsive navigation, localized routes, and publishing

Phase 5 completes the mock marketplace workflow:

1. Cleaner onboarding, profile editing, service areas, weekly availability,
   vacation mode, favourites, and responsive dashboard widgets
2. Cleaner job discovery with marketplace-specific filters and job details
3. Offer submission, validation, editing, withdrawal, and read-only terminal
   states
4. Owner offer comparison, manual rejection, single-offer acceptance, and
   automatic rejection of competing offers
5. Accepted-job contact sharing and cleaner-driven job progress states
6. Persisted marketplace activities for submitted, edited, withdrawn,
   accepted, rejected, confirmed, started, and completed events
7. Unit and browser coverage for the complete published-job-to-accepted-offer
   workflow

## Current folder structure

```text
components/
  auth/
  base/
  cleaner/
  dashboard/
  jobs/
  offers/
  public/
data/mock/
domains/
locales/
middleware/
pages/
plugins/
repositories/
  auth/
  jobs/
  mock/
  notifications/
  offers/
  ratings/
  subscriptions/
  users/
schemas/
scripts/
services/
  autosave/
  jobs/
  offers/
  uploads/
stores/
tests/unit/
types/
utils/
```

Repository injection is provided by `plugins/repositories.ts`. Stores depend on
repository contracts and never access Supabase directly. Production uses
Supabase Auth, PostgreSQL, RLS and private Storage. `MockDatabase` is available
only when `INFRASTRUCTURE_MODE=mock` is explicitly selected in development or
tests; production rejects that mode.

## Localized routes

Croatian routes use no locale prefix. English routes use `/en`.

| Purpose | Croatian | English |
| --- | --- | --- |
| Home | `/` | `/en` |
| Login | `/prijava` | `/en/login` |
| Registration | `/registracija` | `/en/register` |
| Forgot password | `/zaboravljena-lozinka` | `/en/forgot-password` |
| Forbidden | `/zabranjeno` | `/en/forbidden` |
| Owner dashboard | `/dashboard` | `/en/dashboard` |
| Owner jobs | `/dashboard/poslovi` | `/en/dashboard/jobs` |
| New owner job | `/dashboard/poslovi/novi` | `/en/dashboard/jobs/new` |
| Owner profile | `/dashboard/profil` | `/en/dashboard/profile` |
| Owner settings | `/dashboard/postavke` | `/en/dashboard/settings` |
| Cleaner dashboard | `/dashboard-cleaner` | `/en/dashboard-cleaner` |
| Cleaner jobs | `/dashboard-cleaner/poslovi` | `/en/dashboard-cleaner/jobs` |
| Cleaner favourites | `/dashboard-cleaner/favoriti` | `/en/dashboard-cleaner/favourites` |
| Cleaner offers | `/dashboard-cleaner/ponude` | `/en/dashboard-cleaner/offers` |
| Accepted jobs | `/dashboard-cleaner/prihvaceni-poslovi` | `/en/dashboard-cleaner/accepted-jobs` |
| Cleaner availability | `/dashboard-cleaner/dostupnost` | `/en/dashboard-cleaner/availability` |
| Cleaner profile | `/dashboard-cleaner/profil` | `/en/dashboard-cleaner/profile` |
| Admin dashboard | `/admin` | `/en/admin` |
| Owner onboarding | `/onboarding/vlasnik` | `/en/onboarding/owner` |
| Cleaner onboarding | `/onboarding/cistac` | `/en/onboarding/cleaner` |

## Dependency roles

- `nuxt`, `vue`, `vue-router`: application framework
- `@nuxtjs/i18n`: localized messages and routes
- `pinia`, `@pinia/nuxt`: coordinated application state
- `sass`: SCSS compilation
- `@fontsource-variable/montserrat`: self-hosted Montserrat font
- `@lucide/vue`: SVG icons
- `zod`: form and profile validation
- `vitest`, `@vue/test-utils`: unit and component testing
- `@playwright/test`: end-to-end testing
- `@nuxt/eslint`, `eslint`, `typescript`, `vue-tsc`: static quality checks

## Production infrastructure

- Supabase SSR cookies are the authentication source of truth.
- PostgreSQL and RLS enforce ownership, roles, participation and entitlements.
- Stripe is the billing source of truth; PostgreSQL stores a durable projection.
- Private Storage buckets hold avatars and job images.
- Vue components consume stores and services, not Supabase clients.
- Anonymous feedback is accepted only by the rate-limited Nuxt endpoint.

See `docs/production-infrastructure.md` and `docs/rls-policy-overview.md`.
