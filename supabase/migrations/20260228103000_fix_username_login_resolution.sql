-- Harden username login resolution so it does not depend on auth.users join permissions.

alter table if exists public.user_profiles
	add column if not exists login_email text;

-- Backfill login email from auth.users.
update public.user_profiles p
set login_email = u.email
from auth.users u
where u.id = p.user_id
	and (p.login_email is null or p.login_email <> u.email);

-- Keep profile sync trigger updated to include email.
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

	insert into public.user_profiles (user_id, username, login_email)
	values (new.id, candidate, new.email)
	on conflict (user_id) do update
	set login_email = excluded.login_email;

	return new;
end;
$$;

-- Sync email changes from auth.users to user_profiles.
create or replace function public.handle_auth_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.user_profiles
	set login_email = new.email
	where user_id = new.id;

	return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
execute procedure public.handle_auth_user_email_updated();

-- Resolve username -> email from profile cache.
create or replace function public.resolve_login_email(p_username text)
returns table (email text)
language sql
security definer
set search_path = public
as $$
	select p.login_email as email
	from public.user_profiles p
	where lower(p.username) = lower(p_username)
		and p.login_email is not null
	limit 1;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;
