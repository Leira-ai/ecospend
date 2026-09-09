begin;

revoke execute on function public.create_transfer(uuid,uuid,bigint,timestamptz,text,text) from public, anon;
grant execute on function public.create_transfer(uuid,uuid,bigint,timestamptz,text,text) to authenticated;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

revoke execute on function public.attachment_path_is_valid(text) from public, anon;
grant execute on function public.attachment_path_is_valid(text) to authenticated;

commit;
