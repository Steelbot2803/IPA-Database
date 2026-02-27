-- Username directory for login (separate from auth schema)
create table if not exists public.user_profiles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	username text not null unique,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint user_profiles_username_format check (username ~ '^[a-zA-Z0-9_.-]{3,32}$')
);

-- Keep timestamp fresh on updates
create or replace function public.touch_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists trg_touch_user_profiles_updated_at on public.user_profiles;
create trigger trg_touch_user_profiles_updated_at
before update on public.user_profiles
for each row
execute procedure public.touch_user_profiles_updated_at();

-- Auto-create profile row from auth.users (fallback username from email prefix)
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	base_username text;
	candidate text;
	suffix int := 0;
begin
	base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_.-]', '', 'g'));
	if base_username is null or length(base_username) < 3 then
		base_username := 'user';
	end if;

	candidate := base_username;
	while exists (select 1 from public.user_profiles where username = candidate) loop
		suffix := suffix + 1;
		candidate := base_username || suffix::text;
	end loop;

	insert into public.user_profiles (user_id, username)
	values (new.id, candidate)
	on conflict (user_id) do nothing;

	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_auth_user_created();

-- Backfill profiles for existing auth users
insert into public.user_profiles (user_id, username)
select
	u.id,
	coalesce(
		nullif(lower(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9_.-]', '', 'g')), ''),
		'user_' || replace(u.id::text, '-', '')
	)
from auth.users u
where not exists (select 1 from public.user_profiles p where p.user_id = u.id);

-- User can read/update own profile only
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- RPC used by login form to map username -> email safely
create or replace function public.resolve_login_email(p_username text)
returns table (email text)
language sql
security definer
set search_path = public, auth
as $$
	select u.email
	from public.user_profiles p
	join auth.users u on u.id = p.user_id
	where lower(p.username) = lower(p_username)
	limit 1;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;
