begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(30);

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000001','authenticated','authenticated','user-a@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','b0000000-0000-4000-8000-000000000001','authenticated','authenticated','user-b@example.invalid','',now(),'{}','{}',now(),now());
insert into public.accounts (id,user_id,name,type,currency_code) values
('a1000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','A Cash','cash','IDR'),
('b1000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','B Cash','cash','IDR');
insert into public.categories (id,user_id,name,slug,kind,is_system) values
('a2000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','A Expense','a-expense','expense',false),
('b2000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','B Expense','b-expense','expense',false);
insert into public.transactions (id,user_id,account_id,category_id,kind,amount_minor,currency_code,description,transacted_at) values
('a3000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000001','expense',1000,'IDR','A row','2026-01-01T00:00:00Z'),
('b3000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001','expense',2000,'IDR','B row','2026-01-01T00:00:00Z');
insert into public.tags (id,user_id,name) values
('a4000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','A tag'),
('b4000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','B tag');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select * from public.transactions$$, '42501', null, 'anon is denied transaction reads');
select throws_ok($$insert into public.accounts(user_id,name,type) values ('a0000000-0000-4000-8000-000000000001','Anonymous','cash')$$, '42501', null, 'anon is denied account inserts');
select throws_ok($$select * from public.create_transfer('a1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001',1)$$, '42501', null, 'anon is denied transfer RPC execution');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*) from public.accounts), 1::bigint, 'user A sees only one account');
select is((select id from public.accounts), 'a1000000-0000-4000-8000-000000000001'::uuid, 'user A sees only own account');
select is((select count(*) from public.transactions), 1::bigint, 'user A cannot read user B transactions');
select is((select count(*) from public.categories where not is_system), 1::bigint, 'user A cannot read user B private category');

update public.transactions set description = 'blocked update' where id = 'b3000000-0000-4000-8000-000000000001';
select is((select count(*) from public.transactions where description = 'blocked update'), 0::bigint, 'user A cannot update user B transaction');
delete from public.transactions where id = 'b3000000-0000-4000-8000-000000000001';
select is((select count(*) from public.transactions), 1::bigint, 'user A cannot delete user B transaction');

select lives_ok($$insert into public.accounts(id,user_id,name,type,currency_code) values ('a1000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','A Bank','bank','IDR')$$, 'owner can insert an account');
select lives_ok($$update public.accounts set name = 'A Wallet' where id = 'a1000000-0000-4000-8000-000000000001'$$, 'owner can update an account');
select is((select name from public.accounts where id = 'a1000000-0000-4000-8000-000000000001'), 'A Wallet', 'owner update persists');
select throws_ok($$insert into public.accounts(user_id,name,type) values ('b0000000-0000-4000-8000-000000000001','Spoofed','cash')$$, '42501', null, 'owner cannot insert a row for user B');
select throws_ok($$update public.accounts set user_id = 'b0000000-0000-4000-8000-000000000001' where id = 'a1000000-0000-4000-8000-000000000001'$$, '42501', null, 'owner cannot transfer a row to user B');

select throws_ok($$insert into public.transactions(user_id,account_id,kind,amount_minor,transacted_at) values ('a0000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','expense',10,now())$$, '23503', null, 'composite FK blocks another owner account');
select throws_ok($$insert into public.transactions(user_id,account_id,category_id,kind,amount_minor,transacted_at) values ('a0000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001','expense',10,now())$$, '23514', 'Category ownership or kind is invalid', 'category trigger blocks another owner category');
select throws_ok($$insert into public.transaction_tags(transaction_id,tag_id,user_id) values ('a3000000-0000-4000-8000-000000000001','b4000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001')$$, '23503', null, 'composite FK blocks another owner tag');
select lives_ok($$insert into public.transaction_tags(transaction_id,tag_id,user_id) values ('a3000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001')$$, 'owner can link own transaction and tag');

select is((select count(*) from public.categories where is_system), (select count(*) from public.categories where is_system and user_id is null), 'authenticated user can read all system categories');
select throws_ok($$insert into public.categories(user_id,name,slug,kind,is_system) values (null,'Fake system','fake-system','expense',true)$$, '42501', null, 'authenticated user cannot insert a system category');
select lives_ok($$update public.categories set name = 'Changed' where is_system and id = (select id from public.categories where is_system limit 1)$$, 'system category update is safely filtered by RLS');
select is((select count(*) from public.categories where is_system and name = 'Changed'), 0::bigint, 'system category remains unchanged');
select lives_ok($$delete from public.categories where is_system and id = (select id from public.categories where is_system limit 1)$$, 'system category delete is safely filtered by RLS');
select ok((select count(*) > 0 from public.categories where is_system), 'system categories remain after attempted delete');

select ok((select count(*) > 0 from public.emission_factors), 'authenticated user can read public emission factors');
select throws_ok($$insert into public.emission_factors(factor_key,version,name,activity_unit,kg_co2e_per_unit,valid_from,source_name) values ('test.factor',1,'Test','unit',1,current_date,'Test')$$, '42501', null, 'authenticated user cannot insert an emission factor');
select throws_ok($$update public.emission_factors set name = 'Changed' where id = (select id from public.emission_factors limit 1)$$, '42501', null, 'authenticated user cannot update an emission factor');
select throws_ok($$delete from public.emission_factors where id = (select id from public.emission_factors limit 1)$$, '42501', null, 'authenticated user cannot delete an emission factor');

select lives_ok($$insert into storage.objects(id,bucket_id,name,owner_id) values ('a7000000-0000-4000-8000-000000000001','transaction-attachments','a0000000-0000-4000-8000-000000000001/a3000000-0000-4000-8000-000000000001/a5000000-0000-4000-8000-000000000001/receipt.pdf','a0000000-0000-4000-8000-000000000001')$$, 'owner can create valid attachment storage metadata');
select is((select count(*) from storage.objects where id = 'a7000000-0000-4000-8000-000000000001'), 1::bigint, 'valid storage insert persists');

select * from finish();
rollback;
