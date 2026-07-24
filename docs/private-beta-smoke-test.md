# Private beta smoke test

Run against Stripe test mode and a staging Supabase project first.

1. Register one owner and one cleaner with unique email addresses.
2. Confirm both emails and verify each lands in the correct onboarding flow.
3. Log out, reload, log in and verify cookie session restoration.
4. Confirm owner routes reject the cleaner and cleaner routes reject the owner.
5. Complete both profiles and upload private avatars.
6. Start each seven-day Stripe trial from the billing page.
7. Verify `subscriptions` contains the correct user, plan and Stripe IDs.
8. Create and publish an owner job with an image.
9. Confirm an unrelated visitor cannot obtain its exact address.
10. Submit a cleaner offer.
11. Confirm a second cleaner cannot read or edit that offer.
12. Accept the offer as the owner and verify competing offers are rejected.
13. Confirm only the accepted cleaner can now access the exact address.
14. Progress the job through confirmation, in-progress and completed states.
15. Create one review from each participant and verify duplicates are rejected.
16. Open Billing Portal and return to the correct dashboard.
17. Replay a webhook event and verify one `stripe_events` row and no duplicate side effects.
18. Submit anonymous feedback and verify rate limiting.
19. Request and complete a password reset; verify the old password no longer works.
20. Test Croatian and English at mobile, tablet and desktop widths with keyboard-only navigation.
