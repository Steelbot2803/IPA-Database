-- Follow-up hardening migration.
-- 1) Lock down execute permissions for username lookup RPC.
-- 2) Run collision-safe metadata username backfill as an upgrade-safe step.

-- Remove implicit/public execution rights, then grant only required roles.
revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- Upgrade-safe, collision-safe backfill for metadata usernames.
-- Applies only when current username still matches legacy email-prefix fallback.
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
