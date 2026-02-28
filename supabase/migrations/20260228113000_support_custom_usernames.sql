-- Support usernames that are fully independent from email prefixes.

-- Keep username uniqueness case-insensitive because login lookup is case-insensitive.
create unique index if not exists user_profiles_username_lower_key
	on public.user_profiles ((lower(username)));

create or replace function public.normalize_username(p_username text)
returns text
language sql
immutable
as $$
	select lower(regexp_replace(coalesce(trim(p_username), ''), '[^a-zA-Z0-9_.-]', '', 'g'));
$$;

create or replace function public.generate_unique_username(p_base text, p_user_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
	base_username text;
	candidate text;
	suffix int := 0;
begin
	base_username := public.normalize_username(p_base);

	if base_username is null or length(base_username) < 3 then
		base_username := 'user';
	end if;

	candidate := base_username;
	while exists (
		select 1
		from public.user_profiles p
		where lower(p.username) = lower(candidate)
			and (p_user_id is null or p.user_id <> p_user_id)
	) loop
		suffix := suffix + 1;
		candidate := base_username || suffix::text;
	end loop;

	return candidate;
end;
$$;

-- Prefer explicit username from auth metadata when creating profiles.
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	requested_username text;
	fallback_username text;
	final_username text;
begin
	requested_username := nullif(new.raw_user_meta_data ->> 'username', '');
	fallback_username := split_part(new.email, '@', 1);

	final_username := public.generate_unique_username(
		coalesce(requested_username, fallback_username, 'user'),
		new.id
	);

	insert into public.user_profiles (user_id, username, login_email)
	values (new.id, final_username, new.email)
	on conflict (user_id) do update
	set login_email = excluded.login_email,
		username = coalesce(public.user_profiles.username, excluded.username);

	return new;
end;
$$;

-- Allow users to set/change their own username explicitly.
create or replace function public.set_my_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
	caller_id uuid := auth.uid();
	normalized text;
	final_username text;
begin
	if caller_id is null then
		raise exception 'Authentication required';
	end if;

	normalized := public.normalize_username(p_username);
	if normalized is null or length(normalized) < 3 or length(normalized) > 32 then
		raise exception 'Username must be 3-32 characters and contain only a-z, 0-9, _, ., -';
	end if;

	final_username := public.generate_unique_username(normalized, caller_id);

	update public.user_profiles
	set username = final_username
	where user_id = caller_id;

	if not found then
		raise exception 'Profile not found for current user';
	end if;

	return final_username;
end;
$$;

grant execute on function public.set_my_username(text) to authenticated;

-- Optional one-time backfill:
-- if auth metadata contains a username and current username still looks like the email-prefix fallback,
-- migrate profile username to metadata username (with conflict-safe suffixing).
do $$
declare
	rec record;
	metadata_username text;
	fallback_username text;
	next_username text;
begin
	for rec in
		select p.user_id, p.username, u.email, u.raw_user_meta_data
		from public.user_profiles p
		join auth.users u on u.id = p.user_id
	loop
		metadata_username := nullif(rec.raw_user_meta_data ->> 'username', '');
		if metadata_username is null then
			continue;
		end if;

		fallback_username := public.normalize_username(split_part(rec.email, '@', 1));
		if lower(rec.username) <> fallback_username then
			continue;
		end if;

		next_username := public.generate_unique_username(metadata_username, rec.user_id);
		update public.user_profiles
		set username = next_username
		where user_id = rec.user_id;
	end loop;
end $$;
