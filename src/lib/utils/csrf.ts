import { error } from '@sveltejs/kit';

/**
 * Verifies that a request came from your own site, not a third-party page.
 * Call this at the top of any +server.ts handler that accepts POST/PATCH/DELETE
 * with a JSON body, because SvelteKit's built-in CSRF guard only covers form actions.
 *
 * How it works: browsers automatically send the Origin header on cross-origin
 * requests, but they cannot set it to your domain unless the request actually
 * came from your domain. So checking Origin is enough.
 */
export function requireSameOrigin(request: Request, url: URL): void {
	const origin = request.headers.get('origin');

	// If there's no Origin header at all, the request came from a same-origin
	// context (e.g. a server-side fetch), which is fine.
	if (!origin) return;

	const expected = url.origin; // e.g. "https://yourdomain.com" or "http://localhost:5173"

	if (origin !== expected) {
		throw error(403, 'Cross-origin request blocked.');
	}
}
