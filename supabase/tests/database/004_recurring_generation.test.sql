begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(30);

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','e0000000-0000-4000-8000-000000000001','authenticated','authenticated','recurring-e@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','f0000000-0000-4000-8000-000000000001','authenticated','authenticated','recurring-f@example.invalid','',now(),'{}','{}',now(),now());
update public.profiles set timezone = 'UTC' where id in ('e0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001');
insert into public.accounts (id,user_id,name,type,currency_code,is_archived) values
('e1000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','E Active','bank','IDR',false),
('e1000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000001','E Archived','bank','IDR',true),
('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','F Active','bank','IDR',false);
insert into public.categories (id,user_id,name,slug,kind,is_system) values
('e2000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','E Expense','e-recurring-expense','expense',false),
('f2000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','F Expense','f-recurring-expense','expense',false);

insert into public.recurring_transactions
(id,user_id,account_id,category_id,kind,amount_minor,currency_code,description,frequency,interval_count,next_due_on,ends_on,is_active) values
('e4000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','expense',100,'IDR','two-weekly','weekly',2,(statement_timestamp() at time zone 'UTC')::date - 14,null,true),
('e4000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','expense',200,'IDR','custom-three-day','daily',3,(statement_timestamp() at time zone 'UTC')::date - 6,null,true),
('e4000000-0000-4000-8000-000000000003','e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','expense',300,'IDR','monthly','monthly',1,(statement_timestamp() at time zone 'UTC')::date,null,true),
('e4000000-0000-4000-8000-000000000004','e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','expense',400,'IDR','two-yearly','yearly',2,(statement_timestamp() at time zone 'UTC')::date,null,true),
('e4000000-0000-4000-8000-000000000005','e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','expense',500,'IDR','final','daily',1,(statement_timestamp() at time zone 'UTC')::date,(statement_timestamp() at time zone 'UTC')::date,true),
('e4000000-0000-4000-8000-000000000006','e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','expense',600,'IDR','not-due','daily',1,(statement_timestamp() at time zone 'UTC')::date + 1,null,true),
('e4000000-0000-4000-8000-000000000007','e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002','e2000000-0000-4000-8000-000000000001','expense',700,'IDR','invalid-account','daily',1,(statement_timestamp() at time zone 'UTC')::date,null,true),
('f4000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','expense',800,'IDR','other-owner','daily',1,(statement_timestamp() at time zone 'UTC')::date,null,true);

select ok(has_function_privilege('authenticated','public.generate_due_recurring_transactions()','EXECUTE'),'authenticated can execute generation RPC');
select ok(not has_function_privilege('anon','public.generate_due_recurring_transactions()','EXECUTE'),'anon cannot execute generation RPC');
select is((select proacl is not null and not (proacl::text[] @> array['=X/postgres']) from pg_proc where oid = 'public.generate_due_recurring_transactions()'::regprocedure),true,'PUBLIC cannot execute generation RPC');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.recurring_transaction_occurrences'::regclass),'occurrence guard forces RLS');
select col_is_unique('public','recurring_transaction_occurrences',array['recurring_transaction_id','due_on']::name[],'occurrence key is unique');
select is(public.next_recurring_due('2024-01-31','2024-01-31','monthly',1),'2024-02-29'::date,'monthly clamps to leap-month end');
select is(public.next_recurring_due('2024-02-29','2024-02-29','yearly',1),'2025-02-28'::date,'yearly clamps leap day');
select is(public.next_recurring_due('2026-09-01','2026-09-01','weekly',3),'2026-09-22'::date,'custom weekly interval advances correctly');
select throws_ok($$insert into public.recurring_transactions(user_id,account_id,kind,amount_minor,frequency,next_due_on) values ('e0000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','transfer_debit',1,'daily',current_date)$$,'23514',null,'recurring transfers are rejected');

set local role anon;
select throws_ok($$select * from public.generate_due_recurring_transactions()$$,'42501',null,'anon execution is denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.generate_due_recurring_transactions()$$,'42501','Authentication required','auth.uid is required');
select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
create temp table first_generation as select * from public.generate_due_recurring_transactions();
select is((select cardinality(created_draft_ids) from first_generation),8,'all due occurrences return draft IDs');
select is((select skipped_count from first_generation),1,'invalid due template is counted as skipped');
select is((select skipped_invalid_count from first_generation),1,'invalid account skip is identified');
select is((select skipped_duplicate_count from first_generation),0,'first generation has no duplicates');
select is((select count(*) from public.transactions),8::bigint,'only current owner due transactions are created');
select is((select count(*) from public.transactions where status = 'pending' and source = 'recurring'),8::bigint,'generated activity is pending recurring draft activity');
select is((select count(*) from public.transactions where kind in ('transfer_debit','transfer_credit')),0::bigint,'generation never creates transfers');
select is((select count(*) from public.recurring_transaction_occurrences),8::bigint,'each draft has one occurrence guard');
select is((select next_due_on from public.recurring_transactions where id = 'e4000000-0000-4000-8000-000000000001'),(statement_timestamp() at time zone 'UTC')::date + 14,'two-week schedule catches up and advances');
select is((select next_due_on from public.recurring_transactions where id = 'e4000000-0000-4000-8000-000000000002'),(statement_timestamp() at time zone 'UTC')::date + 3,'custom three-day schedule catches up and advances');
select is((select next_due_on from public.recurring_transactions where id = 'e4000000-0000-4000-8000-000000000004'),((statement_timestamp() at time zone 'UTC')::date + interval '2 years')::date,'yearly interval advances');
select is((select is_active from public.recurring_transactions where id = 'e4000000-0000-4000-8000-000000000005'),false,'schedule deactivates after ends_on');
select is((select next_due_on from public.recurring_transactions where id = 'e4000000-0000-4000-8000-000000000006'),(statement_timestamp() at time zone 'UTC')::date + 1,'not-due schedule is unchanged');
select is((select next_due_on from public.recurring_transactions where id = 'e4000000-0000-4000-8000-000000000007'),(statement_timestamp() at time zone 'UTC')::date,'invalid schedule is not advanced');
select is((select next_due_on from public.recurring_transactions where id = 'f4000000-0000-4000-8000-000000000001'),null::date,'another owner schedule is invisible and untouched');
select is((select cardinality(created_draft_ids) from public.generate_due_recurring_transactions()),0,'repeated opens create no additional drafts');
update public.recurring_transactions set next_due_on = (statement_timestamp() at time zone 'UTC')::date where id = 'e4000000-0000-4000-8000-000000000003';
create temp table duplicate_generation as select * from public.generate_due_recurring_transactions();
select is((select skipped_duplicate_count from duplicate_generation),1,'deterministic guard skips a repeated occurrence');
select is((select count(*) from public.transactions),8::bigint,'duplicate occurrence cannot create a second transaction');
select throws_ok($$insert into public.recurring_transaction_occurrences(user_id,recurring_transaction_id,due_on) values ('e0000000-0000-4000-8000-000000000001','e4000000-0000-4000-8000-000000000003',(statement_timestamp() at time zone 'UTC')::date)$$,'42501',null,'clients cannot bypass occurrence generation');

select * from finish();
rollback;
