# RLS policy overview

All application tables in `public` have RLS enabled.

- Public browsing is limited to safe profiles and published job fields.
- Phone, OIB and exact address use separate restricted tables.
- Owners write only their own jobs and profiles.
- Cleaners write only their own profile, availability, favourites and pending offers.
- Offers are visible only to their cleaner, the job owner and administrators.
- Offer acceptance and job progress use atomic security-definer functions.
- Reviews require completed-job participation and reject self/duplicate reviews.
- Notifications, subscriptions, invoices and payment methods are user-scoped.
- Clients cannot mutate Stripe projections, Stripe event claims or audit logs.
- Anonymous feedback has no direct policy and uses the rate-limited server endpoint.
- Storage paths are scoped by user ID and private buckets issue short-lived URLs.

Security-definer functions fix `search_path`, use narrow grants and derive the
caller from `auth.uid()`.

`0014_rls_verification.sql` verifies that RLS is enabled and privileged billing
tables do not expose client write policies. Cross-user tests should also run
against a disposable local or staging Supabase project before launch.
