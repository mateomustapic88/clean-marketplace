# Production infrastructure setup

## Architecture

Production requires Supabase Auth, PostgreSQL, private Storage and Stripe. It
never falls back to browser mock data. The service-role key is imported only by
Nitro server utilities.

## Local development

For the isolated demo:

```dotenv
INFRASTRUCTURE_MODE=mock
BILLING_MODE=mock
APP_BASE_URL=http://localhost:3000
```

For local Supabase development, run a Supabase project, apply migrations, then
set `INFRASTRUCTURE_MODE=supabase` and the three Supabase variables from
`.env.example`. Never add secrets to Git.

## Migration execution

With Supabase CLI authenticated and linked:

```sh
supabase db push
```

For a new project, all files in `supabase/migrations` must run in numeric order.
Do not apply undocumented Dashboard SQL changes. Use `supabase db reset` only
against a disposable local project.

## Public demo marketplace seed

The production demo catalog is populated by an idempotent service-role script.
It reserves its own Auth emails and job identifiers, updates only records that
carry the matching demo seed marker, and refuses to overwrite a non-demo job or
reuse a non-seed Auth account.

Validate the static dataset without connecting to Supabase:

```sh
pnpm demo:seed:validate
```

To insert or refresh the 20 demo jobs and 40 demo cleaner profiles, provide the
production values through the process environment and run:

```sh
NUXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_JWT=... \
pnpm demo:seed
```

The script does not delete records. Demo Auth accounts receive random unknown
passwords and confirmed placeholder email addresses, so they are catalog
identities rather than shared login accounts. Auth Admin currently requires the
project's legacy `service_role` JWT; keep it process-local and never commit it.
The application can continue using its separately configured `sb_secret_` key.

## Supabase Dashboard

1. Create a production project in the required EU region.
2. Apply all migrations with CLI or SQL Editor in exact order.
3. Confirm every `public` table shows RLS enabled.
4. Confirm `avatars` and `job-images` are private.
5. In Authentication, enable email/password and email confirmation.
6. Set Site URL to `https://clean-marketplace.com`.
7. Add redirect URLs:
   - `https://clean-marketplace.com/auth/callback`
   - `https://clean-marketplace.com/nova-lozinka`
   - approved localhost equivalents for development
8. Customize confirmation and reset email templates without changing the
   generated token parameters.
9. Configure SMTP before inviting real beta users.
10. Do not create admins through signup metadata. Promote an existing verified
    user only through a trusted service-role administration procedure.

## Vercel

Set production-only encrypted variables:

```dotenv
APP_BASE_URL=https://clean-marketplace.com
INFRASTRUCTURE_MODE=supabase
BILLING_MODE=stripe
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NUXT_SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_OWNER_MONTHLY_PRICE_ID=
STRIPE_OWNER_ANNUAL_PRICE_ID=
STRIPE_CLEANER_MONTHLY_PRICE_ID=
STRIPE_CLEANER_ANNUAL_PRICE_ID=
```

The Stripe Prices must represent €19/month or €99/year for owners and
€39/month or €199/year for cleaning professionals. Annual savings shown in the
application are calculated from these centralized amounts.

Add `clean-marketplace.com` as primary and `www.clean-marketplace.com` as an
alias. The application also returns a 308 redirect from `www` to the apex host.
Preview deployments must not override `APP_BASE_URL`; canonical URLs remain the
production domain.

## Safe legacy cleanup

After Supabase mode initializes, the browser removes only
`clean_marketplace_mock_database` and `clean_marketplace_auth_session`.
Language and non-sensitive UI preferences are preserved.

## Account deletion and retention

Deleting `auth.users` cascades application rows. Before enabling self-service
deletion, define legal retention for invoices, feedback, audit logs and reviews.
Storage objects should be removed through the Storage API before account/job
deletion. Stripe customers are not automatically deleted and require a
documented billing retention decision.
