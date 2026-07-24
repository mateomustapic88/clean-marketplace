create extension if not exists pgcrypto;

do $$ begin create type public.user_role as enum ('owner', 'cleaner', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin create type public.user_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;
do $$ begin create type public.job_status as enum ('draft', 'published', 'receiving_offers', 'assigned', 'cleaner_confirmed', 'in_progress', 'completed', 'archived', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type public.budget_type as enum ('hourly', 'fixed');
exception when duplicate_object then null; end $$;
do $$ begin create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
exception when duplicate_object then null; end $$;
do $$ begin create type public.subscription_status as enum ('trial', 'active', 'past_due', 'cancelled', 'expired', 'suspended', 'unpaid', 'incomplete', 'incomplete_expired', 'paused');
exception when duplicate_object then null; end $$;
do $$ begin create type public.feedback_type as enum ('bug', 'improvement', 'support');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$ begin new.updated_at = timezone('utc', now()); return new; end; $$;
revoke all on function public.set_updated_at() from public;
