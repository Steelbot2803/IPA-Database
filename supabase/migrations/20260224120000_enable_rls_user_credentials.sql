-- Add per-user ownership columns
alter table if exists public.trs_prod
	add column if not exists user_id uuid references auth.users(id);

alter table if exists public.trs_prod_plan
	add column if not exists user_id uuid references auth.users(id);

-- New rows should automatically bind to the authenticated user
alter table if exists public.trs_prod
	alter column user_id set default auth.uid();

alter table if exists public.trs_prod_plan
	alter column user_id set default auth.uid();

-- Enforce RLS
alter table if exists public.trs_prod enable row level security;
alter table if exists public.trs_prod_plan enable row level security;

-- Remove old broad policies if they exist
DROP POLICY IF EXISTS "trs_prod_select_own" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_insert_own" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_update_own" ON public.trs_prod;
DROP POLICY IF EXISTS "trs_prod_delete_own" ON public.trs_prod;

DROP POLICY IF EXISTS "trs_prod_plan_select_own" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_insert_own" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_update_own" ON public.trs_prod_plan;
DROP POLICY IF EXISTS "trs_prod_plan_delete_own" ON public.trs_prod_plan;

create policy "trs_prod_select_own"
on public.trs_prod
for select
using (auth.uid() = user_id);

create policy "trs_prod_insert_own"
on public.trs_prod
for insert
with check (auth.uid() = user_id);

create policy "trs_prod_update_own"
on public.trs_prod
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "trs_prod_delete_own"
on public.trs_prod
for delete
using (auth.uid() = user_id);

create policy "trs_prod_plan_select_own"
on public.trs_prod_plan
for select
using (auth.uid() = user_id);

create policy "trs_prod_plan_insert_own"
on public.trs_prod_plan
for insert
with check (auth.uid() = user_id);

create policy "trs_prod_plan_update_own"
on public.trs_prod_plan
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "trs_prod_plan_delete_own"
on public.trs_prod_plan
for delete
using (auth.uid() = user_id);

-- Ensure key views evaluate with caller privileges (RLS-aware)
do $$
begin
	if exists (
		select 1
		from information_schema.views
		where table_schema = 'public' and table_name = 'trs_prod_status_view'
	) then
		execute 'alter view public.trs_prod_status_view set (security_invoker = true)';
	end if;

	if exists (
		select 1
		from information_schema.views
		where table_schema = 'public' and table_name = 'trs_prod_status_count_view'
	) then
		execute 'alter view public.trs_prod_status_count_view set (security_invoker = true)';
	end if;
end $$;
