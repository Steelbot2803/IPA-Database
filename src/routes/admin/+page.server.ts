import { fail, error, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { toUserError } from '$lib/utils/userError';
import type { Actions, PageServerLoad } from './$types';

// This runs every time someone visits /admin.
// It fetches the user list to populate the dropdown.
export const load: PageServerLoad = async ({ locals }) => {
	// If not logged in at all, redirect to login
	if (!locals.user) throw redirect(303, '/login');

	// If logged in but not ADMIN, kick them to the dashboard
	if (locals.role !== 'ADMIN') throw redirect(303, '/');

	// We need the service role key here to list all users.
	// This code only ever runs on the server, never in the browser.
	const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? '';
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

	if (!supabaseUrl || !serviceRoleKey) {
		throw error(500, 'Server configuration error: missing Supabase credentials.');
	}

	const adminClient = createClient(supabaseUrl, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	const { data: authData, error: listError } = await adminClient.auth.admin.listUsers();

	if (listError) {
		throw error(500, toUserError('Could not load user list', listError.message));
	}

	// Also fetch roles from your user_profiles table using the normal client
	const { data: profiles } = await locals.supabase.from('user_profiles').select('user_id, role');

	const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.role]));

	// Shape the data so the page only gets what it needs — no raw auth objects
	const users = (authData.users ?? []).map((u) => ({
		id: u.id,
		email: u.email ?? '',
		username: (u.user_metadata?.username as string) ?? null,
		role: (profileMap.get(u.id) as string) ?? 'GUEST'
	}));

	return { users };
};

export const actions: Actions = {
	changePassword: async ({ request, locals }) => {
		// Double-check role even in the action — never trust only the load function
		if (!locals.user) return fail(401, { error: 'Not authenticated.' });
		if (locals.role !== 'ADMIN') return fail(403, { error: 'ADMIN role required.' });

		const form = await request.formData();
		const targetUserId = String(form.get('user_id') ?? '').trim();
		const newPassword = String(form.get('new_password') ?? '').trim();
		const confirmPassword = String(form.get('confirm_password') ?? '').trim();

		// Validate before even calling the Edge Function
		if (!targetUserId) return fail(422, { error: 'No user selected.' });
		if (!newPassword) return fail(422, { error: 'New password is required.' });
		if (newPassword !== confirmPassword) return fail(422, { error: 'Passwords do not match.' });
		if (newPassword.length < 8)
			return fail(422, { error: 'Password must be at least 8 characters.' });

		// Get the current admin's session token.
		// The Edge Function needs this to verify the caller is actually an ADMIN
		// (it does its own check — we don't just trust our own server-side check).
		const {
			data: { session }
		} = await locals.supabase.auth.getSession();

		if (!session) {
			return fail(401, { error: 'Your session has expired. Please log in again.' });
		}

		const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? '';
		const anonKey = env.VITE_SUPABASE_PUBLISHABLE_SVELTE_KEY ?? env.SUPABASE_ANON_KEY ?? '';
		const edgeFunctionUrl = `${supabaseUrl}/functions/v1/admin-update-password`;

		let response: Response;
		try {
			response = await fetch(edgeFunctionUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					// This is the admin's JWT — the Edge Function verifies it independently
					Authorization: `Bearer ${session.access_token}`,
					apikey: anonKey
				},
				body: JSON.stringify({ targetUserId, newPassword })
			});
		} catch {
			return fail(500, {
				error: 'Could not reach the password update service. Check your connection.'
			});
		}

		if (!response.ok) {
			const body = (await response.json().catch(() => ({}))) as { error?: string };
			return fail(500, { error: body.error ?? 'Failed to update password.' });
		}

		return { success: true };
	}
};
