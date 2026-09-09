begin;

create or replace function public.category_is_available(p_category_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_category_id is null or exists (
    select 1 from public.categories c
    where c.id = p_category_id and (c.is_system or c.user_id = p_user_id)
  );
$$;

create or replace function public.category_allows_transaction(p_category_id uuid, p_user_id uuid, p_kind public.transaction_kind)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_category_id is null then true
    when p_kind = 'expense' then exists (select 1 from public.categories c where c.id = p_category_id and (c.is_system or c.user_id = p_user_id) and c.kind in ('expense','both'))
    when p_kind = 'income' then exists (select 1 from public.categories c where c.id = p_category_id and (c.is_system or c.user_id = p_user_id) and c.kind in ('income','both'))
    else exists (select 1 from public.categories c where c.id = p_category_id and (c.is_system or c.user_id = p_user_id))
  end;
$$;

create or replace function public.validate_category_parent() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.categories%rowtype;
begin
  if new.parent_id is null then return new; end if;
  select * into p from public.categories where id = new.parent_id;
  if not found then raise exception using errcode = '23503', message = 'Parent category does not exist'; end if;
  if (new.is_system and not p.is_system) or (not new.is_system and not p.is_system and p.user_id <> new.user_id) then
    raise exception using errcode = '23514', message = 'Parent category is not available to this owner';
  end if;
  if p.kind <> 'both' and p.kind <> new.kind then raise exception using errcode = '23514', message = 'Parent category kind is incompatible'; end if;
  if exists (select 1 from public.categories c where c.parent_id = new.id and ((not c.is_system and c.user_id <> new.user_id) or (new.kind <> 'both' and c.kind <> new.kind))) then
    raise exception using errcode = '23514', message = 'Category change is incompatible with an existing child';
  end if;
  if exists (
    with recursive descendants as (
      select id from public.categories where parent_id = new.id
      union all select c.id from public.categories c join descendants d on c.parent_id = d.id
    ) select 1 from descendants where id = new.parent_id
  ) then raise exception using errcode = '23514', message = 'Category hierarchy cannot contain a cycle'; end if;
  return new;
end;
$$;
create trigger categories_validate_parent before insert or update of parent_id,user_id,is_system,kind on public.categories
for each row execute function public.validate_category_parent();

create or replace function public.validate_owned_category() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.category_is_available(new.category_id,new.user_id) then
    raise exception using errcode = '23514', message = 'Category is not available to this owner';
  end if;
  return new;
end;
$$;

create or replace function public.validate_transaction_category() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.category_allows_transaction(new.category_id,new.user_id,new.kind) then
    raise exception using errcode = '23514', message = 'Category ownership or kind is invalid';
  end if;
  return new;
end;
$$;
create trigger transactions_validate_category before insert or update of category_id,user_id,kind on public.transactions
for each row execute function public.validate_transaction_category();
create trigger merchant_rules_validate_category before insert or update of category_id,user_id on public.merchant_rules
for each row execute function public.validate_owned_category();
create trigger budgets_validate_category before insert or update of category_id,user_id on public.budgets
for each row execute function public.validate_owned_category();
create or replace function public.validate_recurring_category() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_kind public.transaction_kind := new.kind;
begin
  if not public.category_allows_transaction(new.category_id,new.user_id,v_kind) then
    raise exception using errcode = '23514', message = 'Category ownership or kind is invalid';
  end if;
  return new;
end;
$$;
create trigger recurring_validate_category before insert or update of category_id,user_id,kind on public.recurring_transactions
for each row execute function public.validate_recurring_category();

create or replace function public.prevent_system_category_changes() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.is_system and current_user in ('anon','authenticated') then raise exception using errcode = '42501', message = 'System categories are read-only'; end if;
  if tg_op = 'UPDATE' and old.is_system and current_user in ('anon','authenticated') then raise exception using errcode = '42501', message = 'System categories are read-only'; end if;
  if tg_op = 'INSERT' and new.is_system and current_user in ('anon','authenticated') then raise exception using errcode = '42501', message = 'System categories are read-only'; end if;
  return coalesce(new,old);
end;
$$;
create trigger categories_protect_system before insert or update or delete on public.categories
for each row execute function public.prevent_system_category_changes();

create or replace function public.prevent_emission_factor_changes() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then raise exception using errcode = '42501', message = 'Emission factors are read-only'; end if;
  return coalesce(new,old);
end;
$$;
create trigger emission_factors_read_only before insert or update or delete on public.emission_factors
for each row execute function public.prevent_emission_factor_changes();

create or replace function public.populate_carbon_factor_snapshot() returns trigger
language plpgsql security definer set search_path = '' as $$
declare f public.emission_factors%rowtype;
begin
  select * into f from public.emission_factors where id = new.emission_factor_id;
  if not found then raise exception using errcode = '23503', message = 'Emission factor does not exist'; end if;
  new.factor_key_snapshot := f.factor_key; new.factor_version_snapshot := f.version; new.factor_name_snapshot := f.name;
  new.activity_unit_snapshot := f.activity_unit; new.kg_co2e_per_unit_snapshot := f.kg_co2e_per_unit;
  new.source_snapshot := jsonb_strip_nulls(jsonb_build_object('name',f.source_name,'url',f.source_url,'published_on',f.source_published_on,'metadata',f.metadata));
  new.methodology_snapshot := f.methodology;
  new.estimated_kg_co2e := round(new.activity_amount * f.kg_co2e_per_unit,9);
  return new;
end;
$$;
create trigger carbon_estimates_snapshot before insert on public.transaction_carbon_estimates
for each row execute function public.populate_carbon_factor_snapshot();

create or replace function public.prevent_carbon_snapshot_changes() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.user_id <> old.user_id or new.transaction_id <> old.transaction_id or new.emission_factor_id <> old.emission_factor_id
     or new.factor_key_snapshot <> old.factor_key_snapshot
     or new.factor_version_snapshot <> old.factor_version_snapshot or new.factor_name_snapshot <> old.factor_name_snapshot
     or new.activity_unit_snapshot <> old.activity_unit_snapshot or new.kg_co2e_per_unit_snapshot <> old.kg_co2e_per_unit_snapshot
     or new.source_snapshot <> old.source_snapshot or new.methodology_snapshot is distinct from old.methodology_snapshot
  then raise exception using errcode = '23514', message = 'Emission factor snapshots are immutable'; end if;
  new.estimated_kg_co2e := round(new.activity_amount * new.kg_co2e_per_unit_snapshot,9);
  return new;
end;
$$;
create trigger carbon_estimates_protect_snapshot before update on public.transaction_carbon_estimates
for each row execute function public.prevent_carbon_snapshot_changes();

create or replace function public.guard_transfer_insert() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.kind in ('transfer_debit','transfer_credit') and coalesce(current_setting('app.ecospend_transfer_rpc',true),'') <> 'on' then
    raise exception using errcode = '42501', message = 'Transfers must be created with create_transfer';
  end if;
  return new;
end;
$$;
create trigger transactions_guard_transfer_insert before insert on public.transactions
for each row execute function public.guard_transfer_insert();

create or replace function public.assert_transfer_group(p_group_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_count integer; v_users integer; v_amounts integer; v_currencies integer; v_accounts integer; v_debits integer; v_credits integer;
begin
  if p_group_id is null then return; end if;
  select count(*),count(distinct user_id),count(distinct amount_minor),count(distinct currency_code),count(distinct account_id),
    count(*) filter (where kind = 'transfer_debit' and source = 'transfer'),
    count(*) filter (where kind = 'transfer_credit' and source = 'transfer')
  into v_count,v_users,v_amounts,v_currencies,v_accounts,v_debits,v_credits
  from public.transactions where transfer_group_id = p_group_id;
  if v_count <> 0 and (v_count <> 2 or v_users <> 1 or v_amounts <> 1 or v_currencies <> 1 or v_accounts <> 2 or v_debits <> 1 or v_credits <> 1) then
    raise exception using errcode = '23514', message = 'A transfer must be one matching debit and credit across different accounts';
  end if;
end;
$$;

create or replace function public.validate_transfer_group() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then perform public.assert_transfer_group(old.transfer_group_id); end if;
  if tg_op <> 'DELETE' and (tg_op = 'INSERT' or new.transfer_group_id is distinct from old.transfer_group_id) then
    perform public.assert_transfer_group(new.transfer_group_id);
  end if;
  return coalesce(new,old);
end;
$$;
create constraint trigger transactions_validate_transfer_group after insert or update or delete on public.transactions
deferrable initially deferred for each row execute function public.validate_transfer_group();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id,display_name)
  values (new.id,nullif(left(btrim(coalesce(new.raw_user_meta_data->>'display_name','')),100),''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

create or replace function public.sync_notification_read_state() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'unread' then new.read_at := null;
  elsif new.read_at is null then new.read_at := now(); end if;
  return new;
end;
$$;
create trigger notifications_sync_read_state before insert or update of status,read_at on public.notifications
for each row execute function public.sync_notification_read_state();

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.import_jobs enable row level security;
alter table public.transactions enable row level security;
alter table public.tags enable row level security;
alter table public.transaction_tags enable row level security;
alter table public.merchant_rules enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.emission_factors enable row level security;
alter table public.transaction_carbon_estimates enable row level security;
alter table public.notifications enable row level security;
alter table public.transaction_attachments enable row level security;

-- Ensure service/backend access is still constrained by RLS unless it owns or bypasses RLS.
alter table public.profiles force row level security;
alter table public.accounts force row level security;
alter table public.categories force row level security;
alter table public.import_jobs force row level security;
alter table public.transactions force row level security;
alter table public.tags force row level security;
alter table public.transaction_tags force row level security;
alter table public.merchant_rules force row level security;
alter table public.budgets force row level security;
alter table public.financial_goals force row level security;
alter table public.goal_contributions force row level security;
alter table public.recurring_transactions force row level security;
alter table public.emission_factors force row level security;
alter table public.transaction_carbon_estimates force row level security;
alter table public.notifications force row level security;
alter table public.transaction_attachments force row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy accounts_own_all on public.accounts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categories_select_available on public.categories for select to authenticated using (is_system or (select auth.uid()) = user_id);
create policy categories_insert_own on public.categories for insert to authenticated with check (not is_system and (select auth.uid()) = user_id);
create policy categories_update_own on public.categories for update to authenticated using (not is_system and (select auth.uid()) = user_id) with check (not is_system and (select auth.uid()) = user_id);
create policy categories_delete_own on public.categories for delete to authenticated using (not is_system and (select auth.uid()) = user_id);
create policy import_jobs_own_all on public.import_jobs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transactions_own_all on public.transactions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tags_own_all on public.tags for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transaction_tags_own_all on public.transaction_tags for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy merchant_rules_own_all on public.merchant_rules for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy budgets_own_all on public.budgets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy financial_goals_own_all on public.financial_goals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy goal_contributions_own_all on public.goal_contributions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy recurring_transactions_own_all on public.recurring_transactions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy emission_factors_public_read on public.emission_factors for select to authenticated using (true);
create policy carbon_estimates_own_all on public.transaction_carbon_estimates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notifications_own_all on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transaction_attachments_own_all on public.transaction_attachments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.profiles,public.accounts,public.categories,public.import_jobs,public.transactions,public.tags,
  public.transaction_tags,public.merchant_rules,public.budgets,public.financial_goals,public.goal_contributions,public.recurring_transactions,
  public.transaction_carbon_estimates,public.notifications,public.transaction_attachments to authenticated;
grant select on public.emission_factors to authenticated;
revoke insert,update,delete on public.emission_factors from authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;

create or replace function public.create_transfer(
  p_source_account_id uuid, p_destination_account_id uuid, p_amount_minor bigint,
  p_transacted_at timestamptz default now(), p_description text default '', p_notes text default null
) returns table (transfer_group_id uuid, debit_transaction_id uuid, credit_transaction_id uuid)
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_group_id uuid := extensions.gen_random_uuid(); v_debit_id uuid; v_credit_id uuid;
  v_source_currency text; v_destination_currency text;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_source_account_id = p_destination_account_id then raise exception using errcode = '23514', message = 'Source and destination accounts must differ'; end if;
  if p_amount_minor is null or p_amount_minor <= 0 then raise exception using errcode = '23514', message = 'Transfer amount must be positive'; end if;
  if char_length(coalesce(p_description,'')) > 500 or char_length(coalesce(p_notes,'')) > 4000 then raise exception using errcode = '22001', message = 'Transfer text is too long'; end if;
  perform 1 from public.accounts where id in (p_source_account_id,p_destination_account_id) order by id for update;
  select currency_code into v_source_currency from public.accounts where id = p_source_account_id and user_id = v_user_id and not is_archived;
  select currency_code into v_destination_currency from public.accounts where id = p_destination_account_id and user_id = v_user_id and not is_archived;
  if v_source_currency is null or v_destination_currency is null then raise exception using errcode = '42501', message = 'Both active accounts must be owned by the current user'; end if;
  if v_source_currency <> v_destination_currency then raise exception using errcode = '23514', message = 'Cross-currency transfers are not supported'; end if;
  perform set_config('app.ecospend_transfer_rpc','on',true);
  insert into public.transactions (user_id,account_id,transfer_group_id,kind,status,source,amount_minor,currency_code,description,notes,transacted_at)
  values (v_user_id,p_source_account_id,v_group_id,'transfer_debit','cleared','transfer',p_amount_minor,v_source_currency,coalesce(p_description,''),p_notes,p_transacted_at)
  returning id into v_debit_id;
  insert into public.transactions (user_id,account_id,transfer_group_id,kind,status,source,amount_minor,currency_code,description,notes,transacted_at)
  values (v_user_id,p_destination_account_id,v_group_id,'transfer_credit','cleared','transfer',p_amount_minor,v_destination_currency,coalesce(p_description,''),p_notes,p_transacted_at)
  returning id into v_credit_id;
  perform set_config('app.ecospend_transfer_rpc','off',true);
  return query select v_group_id,v_debit_id,v_credit_id;
end;
$$;
grant execute on function public.create_transfer(uuid,uuid,bigint,timestamptz,text,text) to authenticated;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if exists (
    select 1 from storage.objects
    where bucket_id = 'transaction-attachments' and split_part(name,'/',1) = v_user_id::text
  ) then
    raise exception using errcode = '23503', message = 'Delete private attachment objects before deleting the account';
  end if;
  delete from auth.users where id = v_user_id;
  if not found then raise exception using errcode = 'P0002', message = 'User account not found'; end if;
end;
$$;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.attachment_path_is_valid(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.transactions t
    where t.user_id = auth.uid()
      and p_name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'
      and split_part(p_name,'/',1) = auth.uid()::text
      and split_part(p_name,'/',2) = t.id::text
  );
$$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('transaction-attachments','transaction-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy attachments_storage_select_own on storage.objects for select to authenticated
using (bucket_id = 'transaction-attachments' and split_part(name,'/',1) = (select auth.uid())::text);
create policy attachments_storage_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'transaction-attachments' and (owner_id is null or owner_id = (select auth.uid())::text) and public.attachment_path_is_valid(name));
create policy attachments_storage_update_own on storage.objects for update to authenticated
using (bucket_id = 'transaction-attachments' and split_part(name,'/',1) = (select auth.uid())::text)
with check (bucket_id = 'transaction-attachments' and (owner_id is null or owner_id = (select auth.uid())::text) and public.attachment_path_is_valid(name));
create policy attachments_storage_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'transaction-attachments' and split_part(name,'/',1) = (select auth.uid())::text);

revoke execute on function public.category_is_available(uuid,uuid) from public,anon,authenticated;
revoke execute on function public.category_allows_transaction(uuid,uuid,public.transaction_kind) from public,anon,authenticated;
revoke execute on function public.validate_category_parent() from public,anon,authenticated;
revoke execute on function public.validate_owned_category() from public,anon,authenticated;
revoke execute on function public.validate_transaction_category() from public,anon,authenticated;
revoke execute on function public.validate_recurring_category() from public,anon,authenticated;
revoke execute on function public.prevent_system_category_changes() from public,anon,authenticated;
revoke execute on function public.prevent_emission_factor_changes() from public,anon,authenticated;
revoke execute on function public.populate_carbon_factor_snapshot() from public,anon,authenticated;
revoke execute on function public.prevent_carbon_snapshot_changes() from public,anon,authenticated;
revoke execute on function public.guard_transfer_insert() from public,anon,authenticated;
revoke execute on function public.assert_transfer_group(uuid) from public,anon,authenticated;
revoke execute on function public.validate_transfer_group() from public,anon,authenticated;
revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.sync_notification_read_state() from public,anon,authenticated;
revoke execute on function public.attachment_path_is_valid(text) from public,anon,authenticated;

commit;
