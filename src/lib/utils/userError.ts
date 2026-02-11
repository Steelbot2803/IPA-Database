function extractQuotedValue(message: string): string | null {
	const match = message.match(/"([^"]+)"/);
	return match?.[1] ?? null;
}

export function toUserError(context: string, technicalMessage?: string): string {
	const raw = (technicalMessage ?? '').trim();
	const msg = raw.toLowerCase();

	if (msg.includes('duplicate key')) {
		return `${context} because this value already exists in the system. Please check for duplicate blank/job/serial numbers and try again.`;
	}

	if (msg.includes('foreign key')) {
		return `${context} because one of the linked records could not be found. Please verify that the related blank, job, or model record exists.`;
	}

	if (msg.includes('permission denied') || msg.includes('not authorized') || msg.includes('jwt')) {
		return `${context} because your account does not have permission for this action. Please contact an administrator if you need access.`;
	}

	if (msg.includes('relation') && msg.includes('does not exist')) {
		const table = extractQuotedValue(raw);
		if (table) {
			return `${context} because the connection to the "${table}" table is unavailable right now. Please retry in a moment and report this if it continues.`;
		}
		return `${context} because a required database table could not be reached. Please retry in a moment and report this if it continues.`;
	}

	if (msg.includes('could not connect') || msg.includes('connection refused')) {
		return `${context} because the database connection is currently down. Please try again shortly.`;
	}

	if (
		msg.includes('network') ||
		msg.includes('timed out') ||
		msg.includes('timeout') ||
		msg.includes('failed to fetch')
	) {
		return `${context} because the network connection to the server was interrupted. Please check connectivity and try again.`;
	}

	if (msg.includes('invalid input syntax')) {
		return `${context} because one or more values are in an invalid format. Please review the entered numbers/dates and submit again.`;
	}

	if (msg.includes('violates not-null constraint')) {
		return `${context} because a required field is missing. Please fill all mandatory fields and try again.`;
	}

	return raw
		? `${context}. Additional detail: ${raw}`
		: `${context}. Please try again. If the issue continues, contact support.`;
}
