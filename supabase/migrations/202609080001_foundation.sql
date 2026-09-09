begin;
create extension if not exists pgcrypto with schema extensions;

create type public.account_type as enum ('cash','bank','e_wallet','credit_card','investment','other');
create type public.category_kind as enum ('expense','income','both');
create type public.transaction_kind as enum ('expense','income','transfer_debit','transfer_credit','adjustment');
create type public.transaction_status as enum ('pending','cleared','void');
create type public.transaction_source as enum ('manual','import','recurring','transfer','api');
create type public.rule_match_type as enum ('contains','exact','regex');
create type public.budget_period as enum ('weekly','monthly','quarterly','yearly','custom');
create type public.goal_status as enum ('active','paused','completed','cancelled');
create type public.recurrence_frequency as enum ('daily','weekly','monthly','yearly');
create type public.import_status as enum ('queued','processing','completed','failed','cancelled');
create type public.notification_type as enum ('budget_alert','goal_progress','recurring_due','import_complete','system');
create type public.notification_status as enum ('unread','read','archived');

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
revoke all on function public.set_updated_at() from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 100),
  currency_code text not null default 'IDR' check (currency_code ~ '^[A-Z]{3}$'),
  locale text not null default 'id-ID' check (char_length(locale) between 2 and 20),
  timezone text not null default 'Asia/Jakarta' check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100), type public.account_type not null,
  currency_code text not null default 'IDR' check (currency_code ~ '^[A-Z]{3}$'),
  opening_balance_minor bigint not null default 0, institution_name text check (institution_name is null or char_length(institution_name) <= 120),
  last_four text check (last_four is null or last_four ~ '^[A-Za-z0-9]{1,4}$'), is_archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id)
);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80), slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind public.category_kind not null, parent_id uuid references public.categories(id) on delete restrict,
  icon text check (icon is null or char_length(icon) <= 50), color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  is_system boolean not null default false, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((is_system and user_id is null) or (not is_system and user_id is not null)), check (parent_id is null or parent_id <> id)
);

create table public.import_jobs (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  status public.import_status not null default 'queued', source_name text not null check (char_length(btrim(source_name)) between 1 and 100),
  original_filename text check (original_filename is null or char_length(original_filename) <= 255),
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'), options jsonb not null default '{}'::jsonb,
  total_rows integer check (total_rows is null or total_rows >= 0), imported_rows integer not null default 0 check (imported_rows >= 0),
  skipped_rows integer not null default 0 check (skipped_rows >= 0), error_rows integer not null default 0 check (error_rows >= 0),
  error_summary jsonb not null default '{}'::jsonb, started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id),
  check (jsonb_typeof(options) = 'object'), check (jsonb_typeof(error_summary) = 'object'),
  check (total_rows is null or imported_rows + skipped_rows + error_rows <= total_rows), check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.transactions (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null, category_id uuid references public.categories(id) on delete set null,
  import_job_id uuid, transfer_group_id uuid,
  kind public.transaction_kind not null, status public.transaction_status not null default 'cleared', source public.transaction_source not null default 'manual',
  amount_minor bigint not null check (amount_minor > 0), currency_code text not null default 'IDR' check (currency_code ~ '^[A-Z]{3}$'),
  merchant_name text check (merchant_name is null or char_length(merchant_name) <= 160), description text not null default '' check (char_length(description) <= 500),
  notes text check (notes is null or char_length(notes) <= 4000), external_id text check (external_id is null or char_length(external_id) <= 255),
  transacted_at timestamptz not null, posted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id,user_id), foreign key (account_id,user_id) references public.accounts(id,user_id) on delete cascade,
  foreign key (import_job_id,user_id) references public.import_jobs(id,user_id) on delete set null (import_job_id),
  check ((kind in ('transfer_debit','transfer_credit') and transfer_group_id is not null and category_id is null and source = 'transfer') or
         (kind not in ('transfer_debit','transfer_credit') and transfer_group_id is null and source <> 'transfer'))
);

create table public.tags (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 50), color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id)
);

create table public.transaction_tags (
  transaction_id uuid not null, tag_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (transaction_id,tag_id),
  foreign key (transaction_id,user_id) references public.transactions(id,user_id) on delete cascade,
  foreign key (tag_id,user_id) references public.tags(id,user_id) on delete cascade
);

-- Per-owner uniqueness uses expression indexes so names remain case-insensitive.
create unique index accounts_user_name_uidx on public.accounts (user_id,lower(name)) where not is_archived;
create unique index categories_system_slug_uidx on public.categories (slug) where is_system;
create unique index categories_user_slug_uidx on public.categories (user_id,slug) where not is_system;
create unique index tags_user_name_uidx on public.tags (user_id,lower(name));
create unique index transactions_import_external_uidx on public.transactions (user_id,import_job_id,external_id) where import_job_id is not null and external_id is not null;
create index accounts_user_idx on public.accounts (user_id,is_archived);
create index categories_user_idx on public.categories (user_id,kind);
create index categories_parent_idx on public.categories (parent_id);
create index import_jobs_user_created_idx on public.import_jobs (user_id,created_at desc);
create index transactions_user_date_idx on public.transactions (user_id,transacted_at desc);
create index transactions_account_date_idx on public.transactions (account_id,transacted_at desc);
create index transactions_category_date_idx on public.transactions (category_id,transacted_at desc);
create index transactions_transfer_group_idx on public.transactions (transfer_group_id) where transfer_group_id is not null;
create index tags_user_idx on public.tags (user_id);
create index transaction_tags_tag_idx on public.transaction_tags (tag_id);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger accounts_set_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger import_jobs_set_updated_at before update on public.import_jobs for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger tags_set_updated_at before update on public.tags for each row execute function public.set_updated_at();

commit;
