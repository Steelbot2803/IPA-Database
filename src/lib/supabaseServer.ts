import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export function getSupabase(cookies: Cookies) {
	const supabaseURL = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
	const supabaseAnonKey =
		env.VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY ??
		env.SUPABASE_ANON_KEY ??
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseURL || !supabaseAnonKey) {
		throw new Error('Missing Supabase environment variables.');
	}

	return createServerClient(supabaseURL, supabaseAnonKey, {
		cookies: {
			getAll: () =>
				cookies.getAll().map((cookie) => ({
					name: cookie.name,
					value: cookie.value
				})),

			setAll: (cookiesToSet) => {
				for (const cookie of cookiesToSet) {
					cookies.set(cookie.name, cookie.value, {
						...cookie.options,
						path: '/',
						httpOnly: true,
						sameSite: cookie.options?.sameSite ?? 'lax'
					});
				}
			}
		}
	});
}
