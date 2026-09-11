-- Commercial billing foundation: hybrid Midtrans + Lemon Squeezy subscriptions.
-- All tables are protected by RLS. Webhooks must use service-role credentials.

create type public.subscription_plan as enum ('free', 'pro_monthly', 'pro_yearly');
create type public.subscription_gateway as enum ('midtrans', 'lemon_squeezy');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  gateway public.subscription_gateway,
  external_customer_id text,
  external_subscription_id text,
  status public.subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_paid_gateway_check check (
    plan = 'free' or (gateway is not null and external_subscription_id is not null)
  ),
  constraint subscriptions_period_check check (
    current_period_end is null or current_period_start is null or current_period_end >= current_period_start
  )
);

create unique index subscriptions_one_current_per_user
  on public.subscriptions(user_id)
  where status in ('trialing', 'active', 'past_due');

create unique index subscriptions_external_id_unique
  on public.subscriptions(gateway, external_subscription_id)
  where external_subscription_id is not null;

create table public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  gateway public.subscription_gateway not null,
  external_event_id text not null,
  payload_hash text not null,
  event_type text not null,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz not null default now(),
  constraint billing_webhook_hash_format check (payload_hash ~ '^[a-f0-9]{64}$'),
  unique(gateway, external_event_id)
);

create table public.billing_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  gateway public.subscription_gateway not null,
  external_payment_id text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency_code char(3) not null check (currency_code ~ '^[A-Z]{3}$'),
  payment_status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(gateway, external_payment_id)
);

alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;
alter table public.billing_webhook_events enable row level security;
alter table public.billing_webhook_events force row level security;
alter table public.billing_receipts enable row level security;
alter table public.billing_receipts force row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can read own receipts"
  on public.billing_receipts for select to authenticated
  using (user_id = (select auth.uid()));

-- No user policies on webhook events: gateway callbacks use service-role only.
-- Subscription writes are also service-role only to prevent client-side plan escalation.

revoke all on public.subscriptions from anon, authenticated;
revoke all on public.billing_webhook_events from anon, authenticated;
revoke all on public.billing_receipts from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.billing_receipts to authenticated;

create or replace function public.current_user_plan()
returns public.subscription_plan
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select case
        when s.status in ('trialing', 'active') and (s.current_period_end is null or s.current_period_end > now())
        then s.plan
        when s.status = 'past_due' and s.current_period_end is not null and s.current_period_end + interval '3 days' > now()
        then s.plan
        else 'free'::public.subscription_plan
      end
      from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status in ('trialing', 'active', 'past_due')
      order by s.updated_at desc
      limit 1
    ),
    'free'::public.subscription_plan
  );
$$;

revoke all on function public.current_user_plan() from public, anon;
grant execute on function public.current_user_plan() to authenticated;
