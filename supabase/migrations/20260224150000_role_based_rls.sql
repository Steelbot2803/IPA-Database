-- Add role column for role-based authorization
alter table if exists public.user_profiles
	add column if not exists role text not null default 'user',
	add constraint user_profiles_role_check check (role in ('admin', 'user', 'guest'));

-- Ensure any null/invalid legacy values are normalized
update public.user_profiles
set role = 'user'
where role is null or role not in ('admin', 'user', 'guest');

-- Helper to resolve current authenticated user's application role
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		(select p.role from public.user_profiles p where p.user_id = auth.uid() limit 1),
		'guest'
	);
$$;

grant execute on function public.current_app_role() to anon, authenticated;

-- Replace per-owner policies with role-based policies
DROP POLICY IF EXISTS "trs_prod_select_own" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_insert_own" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_update_own" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_delete_own" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_select_by_role" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_insert_by_role" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_update_by_role" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_delete_by_role" ON public.trs_prod;

create policy "trs_prod_select_by_role"
on public.trs_prod
for select
to authenticated
using (public.current_app_role() in ('admin', 'user', 'guest'));

create policy "trs_prod_insert_by_role"
on public.trs_prod
for insert
to authenticated
with check (public.current_app_role() in ('admin', 'user'));

create policy "trs_prod_update_by_role"
on public.trs_prod
for update
to authenticated
using (public.current_app_role() in ('admin', 'user'))
with check (public.current_app_role() in ('admin', 'user'));

create policy "trs_prod_delete_by_role"
on public.trs_prod
for delete
to authenticated
using (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "trs_prod_plan_select_own" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_insert_own" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_update_own" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_delete_own" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_select_by_role" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_insert_by_role" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_update_by_role" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_delete_by_role" ON public.trs_prod_plan;

create policy "trs_prod_plan_select_by_role"
on public.trs_prod_plan
for select
to authenticated
using (public.current_app_role() in ('admin', 'user', 'guest'));

create policy "trs_prod_plan_insert_by_role"
on public.trs_prod_plan
for insert
to authenticated
with check (public.current_app_role() in ('admin', 'user'));

create policy "trs_prod_plan_update_by_role"
on public.trs_prod_plan
for update
to authenticated
using (public.current_app_role() in ('admin', 'user'))
with check (public.current_app_role() in ('admin', 'user'));

create policy "trs_prod_plan_delete_by_role"
on public.trs_prod_plan
for delete
to authenticated
using (public.current_app_role() = 'admin');

-- Allow admins to manage role assignments in profile table
DROP POLICY IF EXISTS "user_profiles_admin_manage" ON public.user_profiles;
create policy "user_profiles_admin_manage"
on public.user_profiles
for all
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');


-- Prevent non-admin users from self-promoting role
create or replace function public.prevent_profile_role_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.role is distinct from old.role and public.current_app_role() <> 'admin' then
		raise exception 'Only admin can change roles';
	end if;
	return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_self_update on public.user_profiles;
create trigger trg_prevent_profile_role_self_update
before update on public.user_profiles
for each row
execute procedure public.prevent_profile_role_self_update();
