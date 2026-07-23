# Phase 7 Stripe deployment guide

## Billing modes

`BILLING_MODE` accepts only `mock` or `stripe`.

- Use `BILLING_MODE=mock` for local automated development and the test suite.
- Use Stripe test mode before any production launch.
- Use `BILLING_MODE=stripe` only when the server secret and both matching Price IDs are configured.
- Stripe mode fails safely when required server configuration is incomplete. It never falls back to mock mode.

Stripe test keys must be paired with test Price IDs. Stripe live keys must be paired with live Price IDs. Live keys belong only in the hosting provider's encrypted production environment variables.

Never commit `.env`. Never expose `STRIPE_SECRET_KEY`. The publishable key may be exposed to a browser only if a future Stripe.js flow requires it.

## Environment variables

Required for Stripe Checkout and Billing Portal:

```dotenv
BILLING_MODE=stripe
APP_BASE_URL=https://YOUR-DOMAIN
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_OWNER_PRICE_ID=
STRIPE_CLEANER_PRICE_ID=
```

Recommended for a dedicated signed billing session key:

```dotenv
AUTH_SESSION_SECRET=
```

If `AUTH_SESSION_SECRET` is absent, the server derives a domain-separated signing value from the server-only Stripe secret. No signing material is exposed to the client.

Required after registering a webhook endpoint:

```dotenv
STRIPE_WEBHOOK_SECRET=
```

`STRIPE_WEBHOOK_SECRET` is intentionally optional before deployment. Without it, `POST /api/stripe/webhook` returns HTTP 503 and processes nothing. Checkout and Billing Portal remain available.

## Optional local webhook testing

Stripe CLI is not required by the normal development or test workflow. If it is already installed and authenticated, forward verified test events to the local Nuxt server:

```sh
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Stripe CLI prints a temporary local `whsec` value. Place that value in `STRIPE_WEBHOOK_SECRET` only for the local terminal session, restart Nuxt, and remove it when finished. Do not commit it.

## Deployment checklist

1. Deploy the application to a Node-compatible hosting provider.
2. Configure production environment variables in the hosting provider.
3. Set `BILLING_MODE=stripe`.
4. Set `APP_BASE_URL` to the production domain.
5. Pair the production Stripe key with production Price IDs.
6. Confirm Stripe Customer Portal is activated and configured in Stripe Dashboard.
7. Register `https://YOUR-DOMAIN/api/stripe/webhook` in Stripe Dashboard.
8. Select `checkout.session.completed`.
9. Select `customer.subscription.created`.
10. Select `customer.subscription.updated`.
11. Select `customer.subscription.deleted`.
12. Select `invoice.paid`.
13. Select `invoice.payment_failed`.
14. Select `invoice.payment_action_required`.
15. Copy the generated signing secret to `STRIPE_WEBHOOK_SECRET`.
16. Redeploy so the new server-only value is available.
17. Send a Stripe test webhook.
18. Verify subscription and invoice synchronization.
19. Verify Checkout success and cancellation redirects.
20. Verify Billing Portal return flow.
21. Verify invoice payment failure behavior.
22. Verify owner and cleaner access restrictions.

## Persistence note

The processed-event repository and subscription repository are isolated behind interfaces for a future durable database adapter. The current Phase 7 adapter follows the existing mock repository architecture and keeps state in the running Node process. A production launch still requires durable repository persistence, planned with the future Supabase migration. Do not rely on process memory for production webhook idempotency.
