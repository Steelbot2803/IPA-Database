import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import { VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY, VITE_SUPABASE_URL } from '$env/static/private';

export function getSupabase(cookies: Cookies) {
	return createServerClient(
		VITE_SUPABASE_URL,
		VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY,

		{
			cookies: {
				get: (name) => cookies.get(name),
				set: (name, value, options) => cookies.set(name, value, { ...options, path: '/' }),
				remove: (name, options) => cookies.delete(name, { ...options, path: '/' })
			}
		}
	);
}
