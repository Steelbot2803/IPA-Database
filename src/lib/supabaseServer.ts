import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export function getSupabase(cookies: Cookies) {
	return createServerClient(
		env.VITE_SUPABASE_URL,
		env.VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY,

		{
			cookies: {
				get: (name) => cookies.get(name),
				set: (name, value, options) => cookies.set(name, value, { ...options, path: '/' }),
				remove: (name, options) => cookies.delete(name, { ...options, path: '/' })
			}
		}
	);
}
