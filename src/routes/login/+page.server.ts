import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type UsernameLookupRow = {
	email: string;
};

function looksLikeEmail(value: string) {
	return value.includes('@');
}

function getServiceRoleClient() {
	const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		return null;
	}

	return createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const identifier = String(form.get('identifier') ?? '').trim();
		const password = String(form.get('password') ?? '').trim();

		if (!identifier || !password) {
			return fail(422, { error: 'Username and password are required.' });
		}

		let resolvedEmail = identifier;

		if (!looksLikeEmail(identifier)) {
			const serviceRoleClient = getServiceRoleClient();

			if (!serviceRoleClient) {
				return fail(500, { error: 'Login is temporarily unavailable.' });
			}

			const { data, error } = await serviceRoleClient
				.rpc('resolve_login_email', { p_username: identifier })
				.single<UsernameLookupRow>();

			if (error || !data?.email) {
				return fail(401, { error: 'Invalid username or password.' });
			}

			resolvedEmail = data.email;
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email: resolvedEmail,
			password
		});

		if (error) {
			return fail(401, { error: 'Invalid username or password.' });
		}

		throw redirect(303, '/');
	}
};
