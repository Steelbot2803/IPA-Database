import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

type AppRole = 'ADMIN' | 'USER' | 'GUEST';

const ADMIN_PATH_PREFIXES = ['/admin'];
const PROTECTED_PATH_PREFIXES = ['/trs'];
const PROTECTED_EXACT_PATHS = ['/'];
const PUBLIC_PATH_PREFIXES = ['/login', '/auth'];
const GUEST_ALLOWED_EXACT_PATHS = new Set(['/', '/trs/lc_db', '/trs/prod_plan_db']);
const GUEST_ALLOWED_PATH_PREFIXES = ['/trs/lc_db/', '/trs/prod_plan_db/'];

function isPublicPath(pathname: string) {
	return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string) {
	if (PROTECTED_EXACT_PATHS.includes(pathname)) return true;
	return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isGuestAllowedPath(pathname: string) {
	if (GUEST_ALLOWED_EXACT_PATHS.has(pathname)) return true;
	return GUEST_ALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const handle: Handle = async ({ event, resolve }) => {
	const supabaseURL = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
	const supabaseAnonKey =
		env.VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY ??
		env.SUPABASE_ANON_KEY ??
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseURL || !supabaseAnonKey) {
		throw new Error('Missing Supabase environment variables.');
	}

	event.locals.supabase = createServerClient(supabaseURL, supabaseAnonKey, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies) => {
				for (const cookie of cookies) {
					event.cookies.set(cookie.name, cookie.value, {
						...cookie.options,
						path: '/',
						httpOnly: true,
						secure: event.url.protocol === 'https:',
						sameSite: cookie.options?.sameSite ?? 'lax'
					});
				}
			}
		}
	});

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user;
	event.locals.role = 'GUEST';

	if (user) {
		const { data: profile } = await event.locals.supabase
			.from('user_profiles')
			.select('role')
			.eq('user_id', user.id)
			.single<{ role: AppRole }>();

		event.locals.role = profile?.role ?? 'GUEST';
	}

	const pathname = event.url.pathname;
	if (!event.locals.user && isProtectedPath(pathname) && !isPublicPath(pathname)) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && pathname === '/login') {
		throw redirect(303, '/');
	}

	if (
		event.locals.user &&
		event.locals.role === 'GUEST' &&
		isProtectedPath(pathname) &&
		!isGuestAllowedPath(pathname)
	) {
		if (event.request.method === 'GET' || event.request.method === 'HEAD') {
			throw redirect(303, '/');
		}

		return new Response('Forbidden for guest role', { status: 403 });
	}

	// Block non-admins from /admin routes entirely
	if (
		event.locals.user &&
		event.locals.role !== 'ADMIN' &&
		ADMIN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
	) {
		throw redirect(303, '/');
	}

	// Block unauthenticated users from /admin routes
	if (!event.locals.user && ADMIN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
