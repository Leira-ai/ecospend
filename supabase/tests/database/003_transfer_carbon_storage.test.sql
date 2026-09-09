begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','c0000000-0000-4000-8000-000000000001','authenticated','authenticated','user-c@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000001','authenticated','authenticated','user-d@example.invalid','',now(),'{}','{}',now(),now());
insert into public.accounts (id,user_id,name,type,currency_code,is_archived) values
('c1000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','C Source','bank','IDR',false),
('c1000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000001','C Destination','cash','IDR',false),
('c1000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000001','C USD','bank','USD',false),
('c1000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000001','C Archived','bank','IDR',true),
('d1000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','D Account','bank','IDR',false);
insert into public.transactions (id,user_id,account_id,kind,amount_minor,currency_code,description,transacted_at)
values ('c3000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','expense',1000,'IDR','Carbon source','2026-01-01T00:00:00Z');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok($$select * from public.create_transfer('c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001',100)$$, '23514', 'Source and destination accounts must differ', 'transfer rejects identical accounts');
select throws_ok($$select * from public.create_transfer('c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002',0)$$, '23514', 'Transfer amount must be positive', 'transfer rejects zero amount');
select throws_ok($$select * from public.create_transfer('c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002',-1)$$, '23514', 'Transfer amount must be positive', 'transfer rejects negative amount');
select throws_ok($$select * from public.create_transfer('c1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001',100)$$, '42501', 'Both active accounts must be owned by the current user', 'transfer rejects another owner account');
select throws_ok($$select * from public.create_transfer('c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000004',100)$$, '42501', 'Both active accounts must be owned by the current user', 'transfer rejects archived account');
select throws_ok($$select * from public.create_transfer('c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000003',100)$$, '23514', 'Cross-currency transfers are not supported', 'transfer rejects different currencies');
select throws_ok($$insert into public.transactions(user_id,account_id,transfer_group_id,kind,status,source,amount_minor,currency_code,transacted_at) values ('c0000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001',gen_random_uuid(),'transfer_debit','cleared','transfer',100,'IDR',now())$$, '42501', 'Transfers must be created with create_transfer', 'direct transfer row insertion is rejected');

select lives_ok($$select * from public.create_transfer('c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002',2500,'2026-02-01T00:00:00Z','Move','Atomic pair')$$, 'valid transfer succeeds');
select is((select count(*) from public.transactions where transfer_group_id is not null), 2::bigint, 'transfer creates exactly two linked records');
select is((select count(distinct transfer_group_id) from public.transactions where transfer_group_id is not null), 1::bigint, 'transfer records share one group');
select is((select count(distinct account_id) from public.transactions where transfer_group_id is not null), 2::bigint, 'transfer records use different accounts');
select is((select count(*) from public.transactions where transfer_group_id is not null and kind = 'transfer_debit'), 1::bigint, 'transfer has one debit');
select is((select count(*) from public.transactions where transfer_group_id is not null and kind = 'transfer_credit'), 1::bigint, 'transfer has one credit');
select is((select count(*) from public.transactions where transfer_group_id is not null and amount_minor = 2500 and currency_code = 'IDR' and source = 'transfer'), 2::bigint, 'transfer values match on both records');

select throws_ok($$insert into public.transaction_carbon_estimates(user_id,transaction_id,emission_factor_id,activity_amount,estimated_kg_co2e,factor_key_snapshot,factor_version_snapshot,factor_name_snapshot,activity_unit_snapshot,kg_co2e_per_unit_snapshot,source_snapshot) values ('c0000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',-1,0,'ignored',1,'ignored','ignored',0,'{}')$$, '23514', null, 'carbon activity cannot be negative');
select lives_ok($$insert into public.transaction_carbon_estimates(id,user_id,transaction_id,emission_factor_id,activity_amount,estimated_kg_co2e,factor_key_snapshot,factor_version_snapshot,factor_name_snapshot,activity_unit_snapshot,kg_co2e_per_unit_snapshot,source_snapshot) values ('c6000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',2,999,'ignored',999,'ignored','ignored',999,'{}')$$, 'carbon estimate insert snapshots factor');
select is((select estimated_kg_co2e from public.transaction_carbon_estimates where id = 'c6000000-0000-4000-8000-000000000001'), 1.700000000::numeric, 'carbon estimate is calculated from activity and factor');
select is((select factor_key_snapshot from public.transaction_carbon_estimates where id = 'c6000000-0000-4000-8000-000000000001'), 'demo.id.electricity-grid', 'factor key is snapshotted');
select is((select factor_version_snapshot from public.transaction_carbon_estimates where id = 'c6000000-0000-4000-8000-000000000001'), 1, 'factor version is snapshotted');
select is((select kg_co2e_per_unit_snapshot from public.transaction_carbon_estimates where id = 'c6000000-0000-4000-8000-000000000001'), 0.850000000::numeric, 'factor value is snapshotted');
select throws_ok($$update public.transaction_carbon_estimates set factor_version_snapshot = 99 where id = 'c6000000-0000-4000-8000-000000000001'$$, '23514', 'Emission factor snapshots are immutable', 'factor snapshot cannot be changed');
select lives_ok($$update public.transaction_carbon_estimates set activity_amount = 3 where id = 'c6000000-0000-4000-8000-000000000001'$$, 'carbon activity can be updated');
select is((select estimated_kg_co2e from public.transaction_carbon_estimates where id = 'c6000000-0000-4000-8000-000000000001'), 2.550000000::numeric, 'updated carbon estimate uses immutable factor snapshot');

select lives_ok($$insert into storage.objects(id,bucket_id,name,owner_id) values ('c7000000-0000-4000-8000-000000000001','transaction-attachments','c0000000-0000-4000-8000-000000000001/c3000000-0000-4000-8000-000000000001/c8000000-0000-4000-8000-000000000001/receipt.pdf','c0000000-0000-4000-8000-000000000001')$$, 'owner can create valid attachment storage metadata');
select throws_ok($$insert into storage.objects(id,bucket_id,name,owner_id) values ('c7000000-0000-4000-8000-000000000002','transaction-attachments','d0000000-0000-4000-8000-000000000001/c3000000-0000-4000-8000-000000000001/c8000000-0000-4000-8000-000000000002/receipt.pdf','c0000000-0000-4000-8000-000000000001')$$, '42501', null, 'owner cannot create storage metadata under another user path');

select * from finish();
rollback;
