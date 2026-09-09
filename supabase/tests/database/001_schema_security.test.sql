begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(47);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'accounts', 'accounts table exists');
select has_table('public', 'categories', 'categories table exists');
select has_table('public', 'transactions', 'transactions table exists');
select has_table('public', 'transaction_tags', 'transaction_tags table exists');
select has_table('public', 'emission_factors', 'emission factors table exists');
select has_table('public', 'transaction_carbon_estimates', 'carbon estimates table exists');
select has_table('public', 'transaction_attachments', 'attachment metadata table exists');

select has_pk('public', 'accounts', 'accounts has a primary key');
select has_fk('public', 'transactions', 'transactions has foreign keys');
select has_check('public', 'transactions', 'transactions has check constraints');
select has_check('public', 'emission_factors', 'emission factors have check constraints');
select has_check('public', 'transaction_carbon_estimates', 'carbon estimates have check constraints');

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles forces RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.accounts'::regclass), 'accounts forces RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.categories'::regclass), 'categories forces RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.transactions'::regclass), 'transactions forces RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.transaction_tags'::regclass), 'transaction tags force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.emission_factors'::regclass), 'emission factors force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.transaction_carbon_estimates'::regclass), 'carbon estimates force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.transaction_attachments'::regclass), 'attachment metadata forces RLS');

select ok(not has_table_privilege('anon', 'public.accounts', 'SELECT'), 'anon cannot select accounts');
select ok(not has_table_privilege('anon', 'public.transactions', 'SELECT'), 'anon cannot select transactions');
select ok(not has_table_privilege('anon', 'public.categories', 'SELECT'), 'anon cannot select categories');
select ok(not has_table_privilege('anon', 'public.emission_factors', 'SELECT'), 'anon cannot select emission factors');
select ok(not has_table_privilege('anon', 'public.accounts', 'INSERT'), 'anon cannot insert accounts');
select ok(not has_table_privilege('anon', 'public.transactions', 'UPDATE'), 'anon cannot update transactions');
select ok(not has_table_privilege('anon', 'public.transactions', 'DELETE'), 'anon cannot delete transactions');

select ok(has_table_privilege('authenticated', 'public.emission_factors', 'SELECT'), 'authenticated can read emission factors');
select ok(not has_table_privilege('authenticated', 'public.emission_factors', 'INSERT'), 'authenticated cannot insert emission factors');
select ok(not has_table_privilege('authenticated', 'public.emission_factors', 'UPDATE'), 'authenticated cannot update emission factors');
select ok(not has_table_privilege('authenticated', 'public.emission_factors', 'DELETE'), 'authenticated cannot delete emission factors');
select ok(has_function_privilege('authenticated', 'public.create_transfer(uuid,uuid,bigint,timestamptz,text,text)', 'EXECUTE'), 'authenticated can execute transfer RPC');
select ok(not has_function_privilege('anon', 'public.create_transfer(uuid,uuid,bigint,timestamptz,text,text)', 'EXECUTE'), 'anonymous users cannot execute transfer RPC');
select ok(not has_function_privilege('authenticated', 'public.assert_transfer_group(uuid)', 'EXECUTE'), 'authenticated cannot call transfer invariant helper');
select ok(has_function_privilege('authenticated', 'public.attachment_path_is_valid(text)', 'EXECUTE'), 'authenticated can execute the storage policy helper');

select policies_are('public', 'profiles', array['profiles_select_own','profiles_update_own']::name[], 'profiles have only own-row policies');
select policies_are('public', 'accounts', array['accounts_own_all']::name[], 'accounts have owner policy');
select policies_are('public', 'categories', array['categories_delete_own','categories_insert_own','categories_select_available','categories_update_own']::name[], 'categories have expected policies');
select policies_are('public', 'transactions', array['transactions_own_all']::name[], 'transactions have owner policy');
select policies_are('public', 'emission_factors', array['emission_factors_public_read']::name[], 'emission factors have read-only policy');
select policies_are('storage', 'objects', array['attachments_storage_delete_own','attachments_storage_insert_own','attachments_storage_select_own','attachments_storage_update_own']::name[], 'storage objects have attachment policies');
select policy_roles_are('public', 'emission_factors', 'emission_factors_public_read', array['authenticated']::name[], 'emission factor reads require authentication');
select policy_cmd_is('public', 'emission_factors', 'emission_factors_public_read', 'SELECT', 'emission factor policy is SELECT only');
select policy_roles_are('storage', 'objects', 'attachments_storage_insert_own', array['authenticated']::name[], 'storage insertion requires authentication');

select is((select public.attachment_path_is_valid('bad/path')), false, 'malformed storage path is rejected');
select is((select count(*) from storage.buckets where id = 'transaction-attachments' and not public and file_size_limit = 10485760), 1::bigint, 'attachment bucket is private and limited to 10 MiB');

select * from finish();
rollback;
