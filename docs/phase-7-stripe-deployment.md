# Stripe production configuration

Stripe remains the billing source of truth. Supabase PostgreSQL stores the
subscription, invoice and payment-method projection used by the UI and
server-authoritative entitlement checks.

## Required server variables

```dotenv
BILLING_MODE=stripe
APP_BASE_URL=https://clean-marketplace.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_OWNER_MONTHLY_PRICE_ID=
STRIPE_OWNER_ANNUAL_PRICE_ID=
STRIPE_CLEANER_MONTHLY_PRICE_ID=
STRIPE_CLEANER_ANNUAL_PRICE_ID=
```

Configured recurring prices:

| Plan | Monthly | Annual | Annual saving |
| --- | ---: | ---: | ---: |
| Apartment owner | €19 | €99 | €129 (57%) |
| Cleaning professional | €39 | €199 | €269 (57%) |

The browser cannot select a Price ID. Checkout uses the authenticated Supabase
user ID and authoritative profile role.

## Dashboard setup

1. Create recurring Prices for EUR 19/month and EUR 99/year for owners.
2. Create recurring Prices for EUR 39/month and EUR 199/year for cleaning professionals.
3. Assign all four IDs to their matching role and billing-period variables.
4. Enable and configure Stripe Customer Portal.
5. Add `https://clean-marketplace.com/api/stripe/webhook`.
6. Subscribe it to `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`,
   `invoice.payment_failed`, and `invoice.payment_action_required`.
7. Store the webhook signing secret in Vercel and redeploy.
8. Keep test keys paired only with test Prices and live keys only with live Prices.

The webhook verifies the raw request signature. `stripe_events` is the durable
idempotency ledger and event timestamps prevent an older delivery replacing a
newer subscription projection.
