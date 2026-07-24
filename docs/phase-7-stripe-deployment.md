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
STRIPE_OWNER_PRICE_ID=
STRIPE_CLEANER_PRICE_ID=
```

The browser cannot select a Price ID. Checkout uses the authenticated Supabase
user ID and authoritative profile role.

## Dashboard setup

1. Create recurring EUR 19/month and EUR 39/month Prices.
2. Assign their IDs to the owner and cleaner variables.
3. Enable and configure Stripe Customer Portal.
4. Add `https://clean-marketplace.com/api/stripe/webhook`.
5. Subscribe it to `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`,
   `invoice.payment_failed`, and `invoice.payment_action_required`.
6. Store the webhook signing secret in Vercel and redeploy.
7. Keep test keys paired only with test Prices and live keys only with live Prices.

The webhook verifies the raw request signature. `stripe_events` is the durable
idempotency ledger and event timestamps prevent an older delivery replacing a
newer subscription projection.
