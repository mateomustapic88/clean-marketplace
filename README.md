# Clean Marketplace

## Phase 7 billing

Phase 7 adds server-side Stripe Checkout, Customer Portal sessions, signed and idempotent webhook processing, role-specific subscription access, invoice and payment-method display, and explicit mock billing for automated development.

Copy `.env.example` to `.env` and use only non-production Stripe test configuration during local integration work. The standard test suite runs with `BILLING_MODE=mock` and never creates Stripe charges.

See [Phase 7 Stripe deployment guide](docs/phase-7-stripe-deployment.md) for configuration, optional Stripe CLI forwarding, webhook behavior before deployment, and the post-deployment checklist.

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

Supabase persistence, administration, production email delivery, analytics,
and push notifications remain outside the current phase.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner01@demo.clean.hr` | `Demo1234` |
| Cleaner | `cleaner01@demo.clean.hr` | `Demo1234` |
| Admin | `admin@demo.clean.hr` | `Demo1234` |

All bundled records and accounts are visibly identified as demo data.
