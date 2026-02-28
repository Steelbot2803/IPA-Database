import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export function getSupabase(cookies: Cookies) {
	const supabaseURL = env.VITE_SUPABASE_URL;
	const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY;

	if (!supabaseURL || !supabaseAnonKey) {
		throw new Error('Missing Supabase environment variables.');
	}

	return createServerClient(supabaseURL, supabaseAnonKey, {
		cookies: {
			get: (name) => cookies.get(name),
			set: (name, value, options) => cookies.set(name, value, { ...options, path: '/' }),
			remove: (name, options) => cookies.delete(name, { ...options, path: '/' })
		}
	});
}
