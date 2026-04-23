<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/utils/toast';

	let { data, form } = $props<{
		data: {
			users: {
				id: string;
				email: string;
				username: string | null;
				role: string;
			}[];
		};
		form: { error?: string; success?: boolean } | null;
	}>();

	let saving = $state(false);
	let selectedUserId = $state('');

	// Whenever the form prop updates (after a submission), show a toast
	$effect(() => {
		if (form?.error) toast.show(form.error, 'error', 5000);
		if (form?.success) toast.show('Password updated successfully.', 'success', 5000);
	});

	// Label helper for the dropdown — shows username if available, otherwise email
	function userLabel(user: { email: string; username: string | null; role: string }): string {
		const name = user.username ?? user.email;
		return `${name} (${user.role})`;
	}
</script>

<div class={uiStyles.c0069}>
	<h1 class={uiStyles.c0021}>Admin — User Management</h1>

	<div class={uiStyles.c0090}>
		<h2 class={uiStyles.c0091}>Change User Password</h2>
		<p class="mb-4 text-sm text-neutral-400">
			Select a user and enter a new password. The user will be able to log in with the new password
			immediately.
		</p>

		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					saving = false;
					// reset: false keeps the dropdown selection after submission
					await update({ reset: false });
				};
			}}
			class="space-y-4"
		>
			<div class={uiStyles.c0045}>
				<label for="user_id" class={uiStyles.c0046}>User</label>
				<select
					id="user_id"
					name="user_id"
					class={uiStyles.c0055}
					bind:value={selectedUserId}
					required
				>
					<option value="">— select a user —</option>
					{#each data.users as user}
						<option value={user.id}>{userLabel(user)}</option>
					{/each}
				</select>
			</div>

			<div class={uiStyles.c0045}>
				<label for="new_password" class={uiStyles.c0046}>New Password</label>
				<input
					id="new_password"
					name="new_password"
					type="password"
					class={uiStyles.c0055}
					placeholder="Minimum 8 characters"
					required
					minlength="8"
				/>
			</div>

			<div class={uiStyles.c0045}>
				<label for="confirm_password" class={uiStyles.c0046}>Confirm Password</label>
				<input
					id="confirm_password"
					name="confirm_password"
					type="password"
					class={uiStyles.c0055}
					placeholder="Repeat the password"
					required
				/>
			</div>

			<div class={uiStyles.c0060}>
				<button type="submit" disabled={saving || !selectedUserId} class={uiStyles.c0062}>
					{saving ? 'Saving…' : 'Change Password'}
				</button>
			</div>
		</form>
	</div>
</div>
