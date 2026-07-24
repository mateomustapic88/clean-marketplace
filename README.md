# Clean Marketplace

## Production infrastructure

Production uses Supabase Auth with SSR cookies, PostgreSQL repositories protected by
RLS, private Storage buckets, durable Stripe subscription projections, and durable
webhook idempotency. Development and automated tests can explicitly select mock
repositories; production fails closed if required infrastructure is missing.

Copy `.env.example` to `.env` and use only non-production Stripe test configuration during local integration work. The standard test suite runs with `BILLING_MODE=mock` and never creates Stripe charges.

See the [production infrastructure guide](docs/production-infrastructure.md),
[RLS overview](docs/rls-policy-overview.md), and
[Stripe deployment guide](docs/phase-7-stripe-deployment.md) before deployment.

A bilingual marketplace for connecting Croatian apartment owners with cleaning professionals.

## Requirements

- Node.js 20.19 or newer
- pnpm 10 or newer

## Development

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## Product scope

- Responsive cleaner dashboard, onboarding, profile, service areas, and weekly availability
- Job discovery with budget, date, service, size, weekend, same-day, distance, and application filters
- Persistent favourite jobs
- Offer submission, editing, withdrawal, status history, and accepted jobs
- Owner offer comparison, acceptance, rejection, and automatic rejection of competing offers
- Contact details revealed only after an offer is accepted
- Cleaner confirmation, work start, completion, and marketplace activity timeline
- Complete Croatian and English marketplace routes and interface copy

The administration interface, custom production email delivery, analytics provider,
and push notifications remain outside the current scope.

## Development mock accounts

Development-only mock credentials are isolated in `data/mock/credentials.json`
and load only when `INFRASTRUCTURE_MODE=mock` is explicitly enabled outside
production. All mock records and accounts are visibly identified as demo data.
