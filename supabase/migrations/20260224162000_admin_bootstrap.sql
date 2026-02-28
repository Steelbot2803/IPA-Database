-- One-time self-bootstrap helper for first admin account.
-- Allows an authenticated user to promote themselves to admin ONLY when no admin exists yet.
create or replace function public.bootstrap_first_admin()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
	caller_id uuid := auth.uid();
	has_admin boolean;
begin
	if caller_id is null then
		raise exception 'Authentication required';
	end if;

	select exists(
		select 1
		from public.user_profiles
		where role = 'admin'
	) into has_admin;

	if has_admin then
		raise exception 'Admin already exists. Ask an existing admin to grant your role.';
	end if;

	update public.user_profiles
	set role = 'admin'
	where user_id = caller_id;

	if not found then
		raise exception 'Profile not found for current user.';
	end if;

	return 'ok';
end;
$$;

grant execute on function public.bootstrap_first_admin() to authenticated;

-- Optional admin action helper after bootstrap.
-- Only admins can change another user's role.
create or replace function public.set_user_role(p_username text, p_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
	if public.current_app_role() <> 'admin' then
		raise exception 'Only admins can change roles';
	end if;

	if p_role not in ('admin', 'user', 'guest') then
		raise exception 'Invalid role';
	end if;

	update public.user_profiles
	set role = p_role
	where lower(username) = lower(p_username);

	if not found then
		raise exception 'Username not found';
	end if;

	return 'ok';
end;
$$;

grant execute on function public.set_user_role(text, text) to authenticated;
