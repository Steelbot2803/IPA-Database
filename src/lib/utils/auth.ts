import { error } from '@sveltejs/kit';

type AppRole = 'ADMIN' | 'USER' | 'GUEST';

const ROLE_HIERARCHY: Record<AppRole, number> = {
	GUEST: 0,
	USER: 1,
	ADMIN: 2
};

/**
 * Throws a 403 error if the user's role is below the required minimum.
 * Call this at the top of any server route or action that mutates data.
 *
 * @example
 * requireRole(locals.role, 'USER'); // blocks GUESTs
 * requireRole(locals.role, 'ADMIN'); // blocks GUESTs and USERs
 */
export function requireRole(role: AppRole, minRole: 'USER' | 'ADMIN'): void {
	if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minRole]) {
		throw error(403, 'You do not have permission to perform this action.');
	}
}

/**
 * Throws a 401 error if there is no authenticated user.
 * Always call this before requireRole.
 */
// AFTER
export function requireUser(user: unknown): asserts user is object {
	if (!user) {
		throw error(401, 'Authentication required.');
	}
}
