// PATH: src/routes/trs/lc_update/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toUserError } from '$lib/utils/userError';
import { requireUser, requireRole } from '$lib/utils/auth';

// ─── UUID validation ──────────────────────────────────────────────────────────
// Supabase parameterises queries so SQL injection isn't possible, but we still
// validate that submitted IDs are real UUIDs so we never pass junk to the DB.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toUUID(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return UUID_REGEX.test(trimmed) ? trimmed : null;
}

// ─── Range parser ─────────────────────────────────────────────────────────────
// Accepts a comma-separated mix of:
//   • individual numbers:    000126, 2600001
//   • plain ranges:          100000-100050
//   • year-suffix ranges:    139425-150025  (last 2 digits = year, must match)
//
// Returns { values } on success or { error } with a user-readable message.
function parseDispatchIdentifiers(raw: string) {
	const tokens = raw
		.split(',')
		.map((token) => token.trim())
		.filter(Boolean);

	const values = new Set<number>();

	for (const token of tokens) {
		if (/^\d+$/.test(token)) {
			values.add(Number(token));
			continue;
		}

		const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
		if (!rangeMatch) {
			return {
				error: `Invalid entry: "${token}". Enter CSV or ranges such as 000126, 2600005-2600010.`
			};
		}

		const startStr = rangeMatch[1];
		const endStr = rangeMatch[2];
		const start = Number(startStr);
		const end = Number(endStr);

		if (end < start) {
			return {
				error: `Invalid range: "${token}". End value must be greater than or equal to Start value.`
			};
		}

		// Year-suffix format: both sides are exactly 6 digits.
		// The last 2 digits encode the year and MUST match across start/end —
		// cross-year ranges must be entered as separate sub-ranges.
		const isYearSuffixFormat = startStr.length === 6 && endStr.length === 6;

		if (isYearSuffixFormat) {
			const startYear = start % 100;
			const endYear = end % 100;

			if (startYear !== endYear) {
				return {
					error: `Cross-year range "${token}" is not supported. Enter each year's range separately, e.g. "139425-XXXX25, 140026-140726".`
				};
			}

			const startBase = Math.floor(start / 100);
			const endBase = Math.floor(end / 100);

			if (endBase < startBase) {
				return { error: `Invalid range: "${token}". End serial must be >= Start serial.` };
			}

			if (endBase - startBase > 1000) {
				return {
					error: `Range too large: "${token}". Split into sub-ranges of 1000 values each.`
				};
			}

			for (let base = startBase; base <= endBase; base++) {
				values.add(base * 100 + startYear);
			}
		} else {
			if (end - start > 1000) {
				return {
					error: `Range too large: "${token}". Split into sub-ranges of 1000 values each.`
				};
			}
			for (let value = start; value <= end; value++) {
				values.add(value);
			}
		}
	}

	if (values.size === 0) {
		return { error: 'Provide at least one value.' };
	}

	if (values.size > 2500) {
		return { error: 'Too many values. Only 2500 values allowed per request.' };
	}

	return { values: Array.from(values) };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DispatchCandidate = {
	id: string;
	blank_no: number | null;
	serial_no: number | null;
	job_no: string | null;
	model_no: string | null;
	job_date: string | null;
	dispatch_date: string | null;
	derived_status: string | null;
};

type DuplicateGroup = {
	key: string;
	label: string;
	options: DispatchCandidate[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Query both serial_no and blank_no columns in trs_prod_status_view (read-only
// view used for lookups) to find which trs_prod row IDs to update, then return
// the set of IDs and any groups that have duplicate matches needing resolution.
async function buildDispatchTargets(values: number[], supabase: SupabaseClient) {
	const ids = new Set<string>();
	const duplicateGroups = new Map<string, DuplicateGroup>();

	const { data: serialRows, error: serialFetchErr } = await supabase
		.from('trs_prod_status_view')
		.select('id, blank_no, serial_no, job_no, model_no, job_date, dispatch_date, derived_status')
		.in('serial_no', values);

	if (serialFetchErr) {
		return {
			error: toUserError('Could not load Serial no Dispatch targets.', serialFetchErr.message)
		};
	}

	const serialGroups = new Map<number, DispatchCandidate[]>();

	for (const row of serialRows ?? []) {
		const normalizedID = toUUID(row.id);
		if (normalizedID === null) continue;
		ids.add(normalizedID);
		if (typeof row.serial_no !== 'number') continue;

		const existing = serialGroups.get(row.serial_no) ?? [];
		existing.push({ ...row, id: normalizedID });
		serialGroups.set(row.serial_no, existing);
	}

	for (const [serialNo, options] of serialGroups.entries()) {
		if (options.length <= 1) continue;
		const key = `serial:${serialNo}`;
		duplicateGroups.set(key, { key, label: `Serial No ${serialNo}`, options });
	}

	const { data: blankRows, error: blankFetchErr } = await supabase
		.from('trs_prod_status_view')
		.select('id, blank_no, serial_no, job_no, model_no, job_date, dispatch_date, derived_status')
		.in('blank_no', values);

	if (blankFetchErr) {
		return {
			error: toUserError('Could not load Blank No Dispatch targets.', blankFetchErr.message)
		};
	}

	const blankGroups = new Map<number, DispatchCandidate[]>();

	for (const row of blankRows ?? []) {
		const normalizedID = toUUID(row.id);
		if (normalizedID === null) continue;
		ids.add(normalizedID);
		if (typeof row.blank_no !== 'number') continue;

		const existing = blankGroups.get(row.blank_no) ?? [];
		existing.push({ ...row, id: normalizedID });
		blankGroups.set(row.blank_no, existing);
	}

	for (const [blankNo, options] of blankGroups.entries()) {
		if (options.length <= 1) continue;
		const key = `blank:${blankNo}`;
		duplicateGroups.set(key, { key, label: `Blank No ${blankNo}`, options });
	}

	return { ids, duplicateGroups: Array.from(duplicateGroups.values()) };
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function load({ url, locals }) {
	const supabase = locals.supabase;

	if (!locals.user) {
		return { jobs: [], job: undefined, notFound: true };
	}

	const blank_no = url.searchParams.get('blank_no');
	const serial_no = url.searchParams.get('serial_no');
	const id = url.searchParams.get('id');
	const success = url.searchParams.get('success');

	const isDigits = (value: string | null) => (value ? /^\d+$/.test(value) : false);
	const toNumericValue = (value: string | null) => {
		if (!isDigits(value)) return null;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	};

	// Direct ID lookup (used after selecting from the duplicate list)
	if (id) {
		// Validate the id is a UUID before sending to DB
		if (!toUUID(id)) {
			return { jobs: [], job: undefined, notFound: true };
		}

		const { data: job, error } = await supabase
			.from('trs_prod_status_view')
			.select('*')
			.eq('id', id)
			.single();

		if (error || !job) return { jobs: [], job: undefined, notFound: true };

		return { jobs: [], job, success: success === 'true' };
	}

	const hasBlankNo = isDigits(blank_no);
	const hasSerialNo = isDigits(serial_no);
	const normalizedBlankNo = toNumericValue(blank_no);
	const normalizedSerialNo = toNumericValue(serial_no);

	if (!hasBlankNo && !hasSerialNo) {
		return { jobs: [], job: undefined, success: success === 'true' };
	}

	let jobs;
	let loadError;

	if (hasBlankNo && normalizedBlankNo !== null) {
		({ data: jobs, error: loadError } = await supabase
			.from('trs_prod_status_view')
			.select('*')
			.eq('blank_no', normalizedBlankNo)
			.order('id', { ascending: false }));
	}

	if (hasSerialNo && normalizedSerialNo !== null && (jobs == null || jobs.length === 0)) {
		({ data: jobs, error: loadError } = await supabase
			.from('trs_prod_status_view')
			.select('*')
			.eq('serial_no', normalizedSerialNo)
			.order('id', { ascending: false }));
	}

	if (loadError || !jobs || jobs.length === 0) {
		return { jobs: [], job: undefined, notFound: true };
	}

	if (jobs.length === 1) {
		return { jobs: [], job: jobs[0], success: success === 'true' };
	}

	return { blank_no, jobs, job: undefined, success: success === 'true' };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export const actions = {
	// ── main: update a single loadcell entry ────────────────────────────────
	main: async ({ request, locals }) => {
		const supabase = locals.supabase;

		requireUser(locals.user);
		requireRole(locals.role, 'USER');

		const f = Object.fromEntries(await request.formData());

		if (!f.id) return fail(422, { error: 'Row ID missing. Cannot update.' });

		// Validate the submitted ID is a real UUID before using it
		const rowId = toUUID(f.id);
		if (!rowId) return fail(422, { error: 'Invalid row ID.' });

		const { data: currentJob, error: currentJobErr } = await supabase
			.from('trs_prod_status_view')
			.select('*')
			.eq('id', rowId)
			.single();

		if (currentJobErr || !currentJob) {
			return fail(500, {
				error: toUserError('Could not load existing entry for comparison', currentJobErr?.message)
			});
		}

		const updatePayload = {
			job_date: f.job_date,
			job_no: f.job_no || null,
			job_card_no: f.job_card_no ? Number(f.job_card_no) : null,
			model_no: f.model_no,
			serial_no: f.serial_no ? Number(f.serial_no) : null,
			customer: f.customer || null,
			remarks: f.remarks || null,
			wiring: f.wiring || null,
			tc0: f.tc0 || null,
			cycling: f.cycling || null,
			cabling: f.cabling || null,
			trimming: f.trimming || null,
			black_putty: f.black_putty || null,
			bellow_welding: f.bellow_welding || null,
			pocket_welding: f.pocket_welding || null,
			sealing_side_1: f.sealing_side_1 || null,
			sealing_side_2: f.sealing_side_2 || null,
			linearity: f.linearity || null,
			tc0_qc: f.tc0_qc || null,
			tinning: f.tinning || null,
			ready_date: f.ready_date || null,
			dispatch_date: f.dispatch_date || null
		};

		const normalize = (value: unknown) => {
			if (value === null || value === '') return null;
			if (typeof value === 'string' && value.includes('T')) return value.slice(0, 10);
			return value;
		};

		const hasChanges = Object.entries(updatePayload).some(
			([key, value]) => normalize(currentJob[key as keyof typeof currentJob]) !== normalize(value)
		);

		if (!hasChanges) return { info: 'Nothing changed or added' };

		// ✅ Write directly to the underlying table, not the view
		const { error: updateErr } = await supabase
			.from('trs_prod')
			.update(updatePayload)
			.eq('id', rowId);

		if (updateErr) {
			return fail(500, { error: toUserError('Could not update entry', updateErr.message) });
		}

		return { success: true };
	},

	// ── dispatch: bulk-update dispatch_date (and optionally job_no/customer) ─
	dispatch: async ({ request, locals }) => {
		const supabase = locals.supabase;

		requireUser(locals.user);
		requireRole(locals.role, 'USER');

		const form = await request.formData();
		const rawValues = String(form.get('dispatch_values') ?? '').trim();
		const dispatchDate = String(form.get('dispatch_date') ?? '').trim();
		const dispatchJobNo = String(form.get('dispatch_job_no') ?? '').trim();
		const dispatchCustomer = String(form.get('dispatch_customer') ?? '').trim();
		const duplicateSelectionRaw = String(form.get('duplicate_selection') ?? '').trim();

		if (!dispatchDate) return fail(422, { error: 'Enter Dispatch Date.' });

		const parsed = parseDispatchIdentifiers(rawValues);
		if ('error' in parsed) return fail(422, { error: parsed.error });

		const targetResult = await buildDispatchTargets(parsed.values, supabase);
		if ('error' in targetResult) return fail(500, { error: targetResult.error });

		const ids = targetResult.ids;
		const duplicateGroups = targetResult.duplicateGroups;

		if (ids.size === 0) {
			return fail(422, { error: 'No entries found for the provided values.' });
		}

		if (duplicateGroups.length > 0) {
			const parsedSelection: Record<string, string[]> = {};
			const jsonSelection: Record<string, string[]> = {};

			if (duplicateSelectionRaw) {
				try {
					const maybeParsed = JSON.parse(duplicateSelectionRaw);
					if (maybeParsed && typeof maybeParsed === 'object' && !Array.isArray(maybeParsed)) {
						for (const [key, value] of Object.entries(maybeParsed)) {
							const rawVals = Array.isArray(value) ? value : [value];
							const normalized = rawVals
								.map((entry) => toUUID(entry))
								.filter((entry): entry is string => entry !== null);
							if (normalized.length > 0) jsonSelection[key] = Array.from(new Set(normalized));
						}
					}
				} catch {
					return fail(422, {
						error: 'Invalid duplicate selection. Please re-select duplicate entries.'
					});
				}
			}

			for (const group of duplicateGroups) {
				const fromCheckboxes = form
					.getAll(group.key)
					.map((entry) => toUUID(entry))
					.filter((entry): entry is string => entry !== null);

				const merged = Array.from(
					new Set([...(jsonSelection[group.key] ?? []), ...fromCheckboxes])
				);
				if (merged.length > 0) parsedSelection[group.key] = merged;
			}

			const missingSelection = duplicateGroups.some(
				(group) => (parsedSelection[group.key] ?? []).length === 0
			);

			if (missingSelection) {
				return fail(409, {
					requiresSelection: true,
					error:
						'Duplicate Serial / Blank No found. Select a row for each duplicate before updating.',
					duplicates: duplicateGroups
				});
			}

			for (const group of duplicateGroups) {
				const selectedIDs = parsedSelection[group.key] ?? [];
				const groupOptionIDs = new Set(group.options.map((o) => o.id));
				const invalidSelection = selectedIDs.some((sid) => !groupOptionIDs.has(sid));

				if (invalidSelection) {
					return fail(422, {
						error: `Invalid selection for ${group.label}. Please select from the listed options.`
					});
				}

				// Remove all candidates for this group, then re-add only selected ones
				for (const option of group.options) ids.delete(option.id);
				for (const sid of selectedIDs) ids.add(sid);
			}
		}

		// ✅ FIX: Build payload with only the fields that were actually provided.
		//    Previously, job_no and customer were always included — even as null —
		//    which would CLEAR existing values when the fields were left empty.
		const updatePayload: Record<string, string | null> = {
			dispatch_date: dispatchDate
		};
		if (dispatchJobNo) updatePayload.job_no = dispatchJobNo;
		if (dispatchCustomer) updatePayload.customer = dispatchCustomer;

		// ✅ Write directly to the underlying table, not the view
		const { error: updateErr } = await supabase
			.from('trs_prod')
			.update(updatePayload)
			.in('id', Array.from(ids));

		if (updateErr) {
			return fail(500, {
				error: toUserError('Could not update dispatch dates', updateErr.message)
			});
		}

		const updatedColumns = ['Dispatch Date'];
		if (dispatchJobNo) updatedColumns.push('Job No');
		if (dispatchCustomer) updatedColumns.push('Customer');

		return {
			success: true,
			updatedCount: ids.size,
			message: `${updatedColumns.join(', ')} updated for ${ids.size} entr${ids.size === 1 ? 'y' : 'ies'}.`
		};
	}
};
