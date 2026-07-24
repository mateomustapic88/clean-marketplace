# Backup, restore and retention

Enable Supabase daily backups and point-in-time recovery appropriate to the beta
risk level. Before launch, perform a staging restore and verify Auth/profile
links, RLS, subscription projections and Storage object references.

Database backups do not replace Storage backups. Export private bucket objects
to encrypted storage on a documented schedule. Never copy service-role keys,
Auth tokens or Stripe secrets into backup logs.

Record retention decisions before public launch:

- Stripe invoices and billing audit data
- Reviews attached to completed work
- Support and bug reports
- Audit logs
- Deleted-user personal data

Test restore steps quarterly and after material schema changes.
