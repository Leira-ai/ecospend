begin;

create table public.merchant_rules (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid, category_id uuid not null references public.categories(id) on delete restrict,
  pattern text not null check (char_length(btrim(pattern)) between 1 and 200), match_type public.rule_match_type not null default 'contains',
  case_sensitive boolean not null default false, priority integer not null default 100 check (priority between 0 and 10000), is_enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id),
  foreign key (account_id,user_id) references public.accounts(id,user_id) on delete cascade
);

create table public.budgets (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict, name text not null check (char_length(btrim(name)) between 1 and 100),
  amount_minor bigint not null check (amount_minor > 0), currency_code text not null default 'IDR' check (currency_code ~ '^[A-Z]{3}$'),
  period public.budget_period not null, starts_on date not null, ends_on date, rollover_enabled boolean not null default false, is_active boolean not null default true,
  alert_threshold_percent smallint not null default 80 check (alert_threshold_percent between 1 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id), check (ends_on is null or ends_on >= starts_on)
);

create table public.financial_goals (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid, name text not null check (char_length(btrim(name)) between 1 and 120), target_amount_minor bigint not null check (target_amount_minor > 0),
  currency_code text not null default 'IDR' check (currency_code ~ '^[A-Z]{3}$'), target_date date, status public.goal_status not null default 'active',
  notes text check (notes is null or char_length(notes) <= 2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id,user_id), foreign key (account_id,user_id) references public.accounts(id,user_id) on delete set null (account_id)
);

create table public.goal_contributions (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null, transaction_id uuid, amount_minor bigint not null check (amount_minor > 0), contributed_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 500), created_at timestamptz not null default now(), unique (id,user_id),
  foreign key (goal_id,user_id) references public.financial_goals(id,user_id) on delete cascade,
  foreign key (transaction_id,user_id) references public.transactions(id,user_id) on delete set null (transaction_id)
);

create table public.recurring_transactions (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null, category_id uuid references public.categories(id) on delete restrict, kind public.transaction_kind not null,
  amount_minor bigint not null check (amount_minor > 0), currency_code text not null default 'IDR' check (currency_code ~ '^[A-Z]{3}$'),
  merchant_name text check (merchant_name is null or char_length(merchant_name) <= 160), description text not null default '' check (char_length(description) <= 500),
  frequency public.recurrence_frequency not null, interval_count smallint not null default 1 check (interval_count between 1 and 365),
  next_due_on date not null, ends_on date, last_generated_at timestamptz, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id),
  foreign key (account_id,user_id) references public.accounts(id,user_id) on delete cascade,
  check (kind in ('expense','income')), check (ends_on is null or ends_on >= next_due_on)
);

create table public.emission_factors (
  id uuid primary key default extensions.gen_random_uuid(), factor_key text not null check (factor_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  version integer not null check (version > 0), name text not null check (char_length(btrim(name)) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000), activity_unit text not null check (char_length(activity_unit) between 1 and 50),
  kg_co2e_per_unit numeric(24,9) not null check (kg_co2e_per_unit >= 0), region_code text not null default 'ID',
  valid_from date not null, valid_to date, source_name text not null check (char_length(btrim(source_name)) between 1 and 200),
  source_url text, source_published_on date, methodology text, metadata jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (factor_key,version), check (valid_to is null or valid_to >= valid_from), check (jsonb_typeof(metadata) = 'object')
);

create table public.transaction_carbon_estimates (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null, emission_factor_id uuid not null references public.emission_factors(id) on delete restrict,
  activity_amount numeric(24,9) not null check (activity_amount >= 0), estimated_kg_co2e numeric(24,9) not null check (estimated_kg_co2e >= 0),
  factor_key_snapshot text not null, factor_version_snapshot integer not null check (factor_version_snapshot > 0), factor_name_snapshot text not null,
  activity_unit_snapshot text not null, kg_co2e_per_unit_snapshot numeric(24,9) not null check (kg_co2e_per_unit_snapshot >= 0),
  source_snapshot jsonb not null, methodology_snapshot text, calculated_at timestamptz not null default now(), created_at timestamptz not null default now(),
  unique (id,user_id), unique (transaction_id), foreign key (transaction_id,user_id) references public.transactions(id,user_id) on delete cascade,
  check (jsonb_typeof(source_snapshot) = 'object')
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null, status public.notification_status not null default 'unread', title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(body) between 1 and 2000), data jsonb not null default '{}'::jsonb, read_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id), check (jsonb_typeof(data) = 'object'),
  check ((status = 'unread' and read_at is null) or status <> 'unread')
);

create table public.transaction_attachments (
  id uuid primary key default extensions.gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null, storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'),
  original_filename text not null check (char_length(btrim(original_filename)) between 1 and 255), content_type text not null check (char_length(content_type) between 1 and 100),
  size_bytes bigint not null check (size_bytes between 1 and 10485760), sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(), unique (id,user_id), foreign key (transaction_id,user_id) references public.transactions(id,user_id) on delete cascade
);

create unique index merchant_rules_user_rule_uidx on public.merchant_rules (user_id,coalesce(account_id,'00000000-0000-0000-0000-000000000000'::uuid),match_type,pattern,case_sensitive);
create unique index budgets_active_scope_uidx on public.budgets (user_id,category_id,period,starts_on) where is_active;
create index budgets_user_active_idx on public.budgets (user_id,is_active,starts_on);
create index financial_goals_user_status_idx on public.financial_goals (user_id,status);
create index goal_contributions_goal_date_idx on public.goal_contributions (goal_id,contributed_at desc);
create index recurring_user_due_idx on public.recurring_transactions (user_id,next_due_on) where is_active;
create index emission_factors_lookup_idx on public.emission_factors (factor_key,is_active,valid_from desc);
create index carbon_estimates_user_idx on public.transaction_carbon_estimates (user_id,calculated_at desc);
create index notifications_user_status_idx on public.notifications (user_id,status,created_at desc);
create index transaction_attachments_transaction_idx on public.transaction_attachments (transaction_id);

create trigger merchant_rules_set_updated_at before update on public.merchant_rules for each row execute function public.set_updated_at();
create trigger budgets_set_updated_at before update on public.budgets for each row execute function public.set_updated_at();
create trigger financial_goals_set_updated_at before update on public.financial_goals for each row execute function public.set_updated_at();
create trigger recurring_transactions_set_updated_at before update on public.recurring_transactions for each row execute function public.set_updated_at();
create trigger emission_factors_set_updated_at before update on public.emission_factors for each row execute function public.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications for each row execute function public.set_updated_at();

commit;
