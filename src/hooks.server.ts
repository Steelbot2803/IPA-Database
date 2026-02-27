import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY, VITE_SUPABASE_URL } from '$env/static/private';

const PROTECTED_PATH_PREFIXES = ['/trs'];
const PROTECTED_EXACT_PATHS = ['/'];
const PUBLIC_PATH_PREFIXES = ['/login', '/auth'];

function isPublicPath(pathname: string) {
	return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string) {
	if (PROTECTED_EXACT_PATHS.includes(pathname)) return true;
	return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		VITE_SUPABASE_URL,
		VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY,
		{
			cookies: {
				get: (name) => event.cookies.get(name),
				set: (name, value, options) => event.cookies.set(name, value, { ...options, path: '/' }),
				remove: (name, options) => event.cookies.delete(name, { ...options, path: '/' })
			}
		}
	);

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user;

	const pathname = event.url.pathname;
	if (!event.locals.user && isProtectedPath(pathname) && !isPublicPath(pathname)) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && pathname === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
