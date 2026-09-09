begin;

-- A generated occurrence remains recorded even if its draft is later deleted, so
-- the same scheduled date can never be silently recreated.
create table public.recurring_transaction_occurrences (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_transaction_id uuid not null,
  due_on date not null,
  transaction_id uuid,
  created_at timestamptz not null default now(),
  unique (id,user_id),
  unique (recurring_transaction_id,due_on),
  unique (transaction_id),
  foreign key (recurring_transaction_id,user_id)
    references public.recurring_transactions(id,user_id) on delete cascade,
  foreign key (transaction_id,user_id)
    references public.transactions(id,user_id) on delete set null (transaction_id)
);

create index recurring_occurrences_user_due_idx
  on public.recurring_transaction_occurrences (user_id,due_on desc);

alter table public.recurring_transaction_occurrences enable row level security;
alter table public.recurring_transaction_occurrences force row level security;
create policy recurring_occurrences_select_own
  on public.recurring_transaction_occurrences for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.recurring_transaction_occurrences from public, anon, authenticated;
grant select on public.recurring_transaction_occurrences to authenticated;

-- Once the final occurrence is generated, next_due_on points past ends_on and
-- the template is inactive. The original constraint did not allow that state.
do $$
declare v_constraint name;
begin
  select conname into v_constraint
  from pg_constraint
  where conrelid = 'public.recurring_transactions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%ends_on%'
    and pg_get_constraintdef(oid) like '%next_due_on%';
  if v_constraint is not null then
    execute format('alter table public.recurring_transactions drop constraint %I',v_constraint);
  end if;
end;
$$;
alter table public.recurring_transactions
  add constraint recurring_transactions_active_end_check
  check (not is_active or ends_on is null or ends_on >= next_due_on);

alter table public.recurring_transactions add column schedule_anchor_on date;
update public.recurring_transactions set schedule_anchor_on = next_due_on;
alter table public.recurring_transactions alter column schedule_anchor_on set not null;

create or replace function public.set_recurring_schedule_anchor() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or (
    new.next_due_on is distinct from old.next_due_on
    and coalesce(current_setting('app.ecospend_recurring_generation',true),'') <> 'on'
  ) then
    new.schedule_anchor_on := new.next_due_on;
  elsif tg_op = 'UPDATE' then
    new.schedule_anchor_on := old.schedule_anchor_on;
  end if;
  return new;
end;
$$;
create trigger recurring_transactions_set_schedule_anchor
before insert or update of next_due_on,schedule_anchor_on on public.recurring_transactions
for each row execute function public.set_recurring_schedule_anchor();

create or replace function public.next_recurring_due(
  p_current date,p_anchor date,p_frequency public.recurrence_frequency,p_interval_count integer
) returns date language plpgsql stable set search_path = '' as $$
declare v_month date; v_last_day integer;
begin
  if p_frequency = 'daily' then return p_current + p_interval_count; end if;
  if p_frequency = 'weekly' then return p_current + (p_interval_count * 7); end if;
  if p_frequency = 'monthly' then
    v_month := (date_trunc('month',p_current)::date + make_interval(months => p_interval_count))::date;
  else
    v_month := make_date(extract(year from p_current)::integer + p_interval_count,
      extract(month from p_anchor)::integer,1);
  end if;
  v_last_day := extract(day from (v_month + interval '1 month - 1 day'))::integer;
  return v_month + (least(extract(day from p_anchor)::integer,v_last_day) - 1);
end;
$$;

create or replace function public.generate_due_recurring_transactions()
returns table (
  created_draft_ids uuid[],
  skipped_count integer,
  skipped_duplicate_count integer,
  skipped_invalid_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_as_of date;
  v_created_ids uuid[] := '{}'::uuid[];
  v_skipped_duplicate integer := 0;
  v_skipped_invalid integer := 0;
  v_processed integer := 0;
  v_due date;
  v_occurrence_id uuid;
  v_transaction_id uuid;
  v_created_for_row boolean;
  r record;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select p.timezone into v_timezone from public.profiles p where p.id = v_user_id;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = v_timezone) then
    v_timezone := 'UTC';
  end if;
  v_as_of := (statement_timestamp() at time zone v_timezone)::date;

  <<recurring_rows>>
  for r in
    select rt.*
    from public.recurring_transactions rt
    where rt.user_id = v_user_id
      and rt.is_active
      and rt.next_due_on <= v_as_of
      and (rt.ends_on is null or rt.next_due_on <= rt.ends_on)
      and rt.kind in ('expense','income')
    order by rt.next_due_on,rt.id
    for update skip locked
  loop
    perform 1 from public.accounts a
      where a.id = r.account_id and a.user_id = v_user_id
        and not a.is_archived and a.currency_code = r.currency_code
      for share;
    if not found or r.category_id is null then
      v_skipped_invalid := v_skipped_invalid + 1;
      continue;
    end if;

    perform 1 from public.categories c
      where c.id = r.category_id
        and (c.is_system or c.user_id = v_user_id)
        and ((r.kind = 'expense' and c.kind in ('expense','both'))
          or (r.kind = 'income' and c.kind in ('income','both')))
      for share;
    if not found then
      v_skipped_invalid := v_skipped_invalid + 1;
      continue;
    end if;

    v_due := r.next_due_on;
    v_created_for_row := false;
    while v_due <= v_as_of and (r.ends_on is null or v_due <= r.ends_on) loop
      exit when v_processed >= 500;
      v_occurrence_id := null;
      insert into public.recurring_transaction_occurrences
        (user_id,recurring_transaction_id,due_on)
      values (v_user_id,r.id,v_due)
      on conflict (recurring_transaction_id,due_on) do nothing
      returning id into v_occurrence_id;

      if v_occurrence_id is null then
        v_skipped_duplicate := v_skipped_duplicate + 1;
      else
        insert into public.transactions
          (user_id,account_id,category_id,kind,status,source,amount_minor,
           currency_code,merchant_name,description,external_id,transacted_at)
        values
          (v_user_id,r.account_id,r.category_id,r.kind,'pending','recurring',
           r.amount_minor,r.currency_code,r.merchant_name,r.description,
           'recurring:' || r.id::text || ':' || v_due::text,
           v_due::timestamp at time zone v_timezone)
        returning id into v_transaction_id;
        update public.recurring_transaction_occurrences
          set transaction_id = v_transaction_id where id = v_occurrence_id;
        v_created_ids := array_append(v_created_ids,v_transaction_id);
        v_created_for_row := true;
      end if;
      v_processed := v_processed + 1;

      v_due := public.next_recurring_due(
        v_due,r.schedule_anchor_on,r.frequency,r.interval_count::integer
      );
    end loop;

    perform set_config('app.ecospend_recurring_generation','on',true);
    update public.recurring_transactions
      set next_due_on = v_due,
          is_active = case when ends_on is not null and v_due > ends_on then false else is_active end,
          last_generated_at = case when v_created_for_row then statement_timestamp() else last_generated_at end
      where id = r.id and user_id = v_user_id;
    perform set_config('app.ecospend_recurring_generation','off',true);
    exit recurring_rows when v_processed >= 500;
  end loop;

  return query select v_created_ids,
    v_skipped_duplicate + v_skipped_invalid,
    v_skipped_duplicate,v_skipped_invalid;
end;
$$;

revoke all on function public.generate_due_recurring_transactions() from public, anon, authenticated;
grant execute on function public.generate_due_recurring_transactions() to authenticated;
revoke all on function public.next_recurring_due(date,date,public.recurrence_frequency,integer) from public, anon, authenticated;
revoke all on function public.set_recurring_schedule_anchor() from public, anon, authenticated;

commit;
