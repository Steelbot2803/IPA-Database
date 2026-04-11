import { fail } from '@sveltejs/kit';
import { parseImportCsv, type ParsedRow } from '$lib/utils/csvImport';
import { toUserError } from '$lib/utils/userError';

export type DuplicateCandidate = {
	id: string;
	blank_no: number | null;
	serial_no: number | null;
	job_no: string | null;
	model_no: string | null;
	job_date: string | null;
	dispatch_date: string | null;
	derived_status: string | null;
};

export type ClassifiedRow =
	| { action: 'insert'; row: ParsedRow }
	| { action: 'update'; id: string; payload: Partial<ParsedRow> }
	| { action: 'skip'; reason: string; blank_no: number | null; serial_no: number | null }
	| {
			action: 'pending';
			key: string;
			label: string;
			candidates: DuplicateCandidate[];
			payload: Partial<ParsedRow>;
	  };

const UPDATABLE_FIELDS = [
	'serial_no',
	'job_date',
	'received_date',
	'job_no',
	'job_card_no',
	'model_no',
	'customer',
	'remarks',
	'wiring',
	'tc0',
	'cycling',
	'cabling',
	'trimming',
	'black_putty',
	'bellow_welding',
	'pocket_welding',
	'sealing_side_1',
	'sealing_side_2',
	'linearity',
	'tc0_qc',
	'tinning',
	'ready_date',
	'dispatch_date'
] as const;

function buildUpdatePayload(csvRow: ParsedRow, dbRow: Record<string, unknown>): Partial<ParsedRow> {
	const payload: Partial<ParsedRow> = {};
	for (const field of UPDATABLE_FIELDS) {
		const csvValue = csvRow[field as keyof ParsedRow];
		const dbValue = dbRow[field];
		if ((dbValue === null || dbValue === undefined || dbValue === '') && csvValue !== null) {
			(payload as Record<string, unknown>)[field] = csvValue;
		}
	}
	return payload;
}

function toCandidate(row: Record<string, unknown>): DuplicateCandidate {
	return {
		id: String(row.id),
		blank_no: typeof row.blank_no === 'number' ? row.blank_no : null,
		serial_no: typeof row.serial_no === 'number' ? row.serial_no : null,
		job_no: typeof row.job_no === 'string' ? row.job_no : null,
		model_no: typeof row.model_no === 'string' ? row.model_no : null,
		job_date: typeof row.job_date === 'string' ? row.job_date : null,
		dispatch_date: typeof row.dispatch_date === 'string' ? row.dispatch_date : null,
		derived_status: typeof row.derived_status === 'string' ? row.derived_status : null
	};
}

export const actions = {
	preview: async ({ request, locals }) => {
		const supabase = locals.supabase;
		if (!locals.user) return fail(401, { error: 'Authentication required.' });

		const formData = await request.formData();
		const file = formData.get('csv_file');

		if (!(file instanceof File) || file.size === 0)
			return fail(422, { error: 'No file uploaded.' });
		if (!file.name.endsWith('.csv')) return fail(422, { error: 'Only .csv files are accepted.' });

		const rawText = await file.text();
		const parseResult = parseImportCsv(rawText);
		if (!parseResult.ok) return fail(422, { error: parseResult.error });

		const rows = parseResult.rows;

		const allBlankNos = rows.map((r) => r.blank_no).filter((v): v is number => v !== null);
		const allSerialNos = rows.map((r) => r.serial_no).filter((v): v is number => v !== null);

		const { data: blankMatches, error: blankErr } = await supabase
			.from('trs_prod_status_view')
			.select('*')
			.in('blank_no', allBlankNos.length > 0 ? allBlankNos : [-1]);

		if (blankErr)
			return fail(500, {
				error: toUserError('Could not look up blank numbers', blankErr.message)
			});

		const { data: serialMatches, error: serialErr } = await supabase
			.from('trs_prod_status_view')
			.select('*')
			.in('serial_no', allSerialNos.length > 0 ? allSerialNos : [-1]);

		if (serialErr)
			return fail(500, {
				error: toUserError('Could not look up serial numbers', serialErr.message)
			});

		const existingByBlank = new Map<number, Record<string, unknown>[]>();
		for (const row of blankMatches ?? []) {
			if (typeof row.blank_no === 'number') {
				const arr = existingByBlank.get(row.blank_no) ?? [];
				arr.push(row);
				existingByBlank.set(row.blank_no, arr);
			}
		}

		const existingBySerial = new Map<number, Record<string, unknown>[]>();
		for (const row of serialMatches ?? []) {
			if (typeof row.serial_no === 'number') {
				const arr = existingBySerial.get(row.serial_no) ?? [];
				arr.push(row);
				existingBySerial.set(row.serial_no, arr);
			}
		}

		const classified: ClassifiedRow[] = [];

		for (const row of rows) {
			if (row.blank_no === null && row.serial_no === null) {
				classified.push({
					action: 'skip',
					reason: 'No identifier (blank_no or serial_no required)',
					blank_no: null,
					serial_no: null
				});
				continue;
			}

			const matchesByBlank = row.blank_no !== null ? (existingByBlank.get(row.blank_no) ?? []) : [];
			const matchesBySerial =
				row.serial_no !== null ? (existingBySerial.get(row.serial_no) ?? []) : [];

			const seenIds = new Set<string>();
			const allMatches: Record<string, unknown>[] = [];
			for (const m of [...matchesByBlank, ...matchesBySerial]) {
				const id = String(m.id);
				if (!seenIds.has(id)) {
					seenIds.add(id);
					allMatches.push(m);
				}
			}

			if (allMatches.length === 0) {
				if (!row.blank_no || !row.job_date || !row.model_no) {
					classified.push({
						action: 'skip',
						reason: 'New entry is missing required fields: blank_no, job_date, model_no',
						blank_no: row.blank_no,
						serial_no: row.serial_no
					});
				} else {
					classified.push({ action: 'insert', row });
				}
			} else if (allMatches.length === 1) {
				const payload = buildUpdatePayload(row, allMatches[0]);
				if (Object.keys(payload).length === 0) {
					classified.push({
						action: 'skip',
						reason: 'Existing entry has no missing fields to fill',
						blank_no: row.blank_no,
						serial_no: row.serial_no
					});
				} else {
					classified.push({ action: 'update', id: String(allMatches[0].id), payload });
				}
			} else {
				const payload = buildUpdatePayload(row, allMatches[0]);
				const keyId = row.blank_no !== null ? `blank:${row.blank_no}` : `serial:${row.serial_no}`;
				const label =
					row.blank_no !== null ? `Blank No ${row.blank_no}` : `Serial No ${row.serial_no}`;

				classified.push({
					action: 'pending',
					key: keyId,
					label,
					payload,
					candidates: allMatches.map(toCandidate)
				});
			}
		}

		return {
			success: true,
			preview: JSON.stringify(classified)
		};
	},

	import: async ({ request, locals }) => {
		const supabase = locals.supabase;
		if (!locals.user) return fail(401, { error: 'Authentication required.' });

		const formData = await request.formData();
		const rawPayload = formData.get('classified_rows');

		if (typeof rawPayload !== 'string' || !rawPayload)
			return fail(422, { error: 'Missing import payload.' });

		let classified: ClassifiedRow[];
		try {
			classified = JSON.parse(rawPayload) as ClassifiedRow[];
		} catch {
			return fail(422, { error: 'Malformed import payload.' });
		}

		const hasPending = classified.some((c) => c.action === 'pending');
		if (hasPending) {
			return fail(422, {
				error:
					'Some duplicate rows have not been resolved. Please select rows for each duplicate before importing.'
			});
		}

		const toInsert = classified
			.filter((c): c is Extract<ClassifiedRow, { action: 'insert' }> => c.action === 'insert')
			.map((c) => c.row);

		const toUpdate = classified.filter(
			(c): c is Extract<ClassifiedRow, { action: 'update' }> => c.action === 'update'
		);

		const skipped = classified.filter((c) => c.action === 'skip').length;

		if (toInsert.length > 0) {
			const { error: insertErr } = await supabase.from('trs_prod').insert(toInsert);
			if (insertErr)
				return fail(500, { error: toUserError('Bulk insert failed', insertErr.message) });
		}

		if (toUpdate.length > 0) {
			const updateResults = await Promise.all(
				toUpdate.map(({ id, payload }) => supabase.from('trs_prod').update(payload).eq('id', id))
			);

			const firstError = updateResults.find((r) => r.error)?.error;
			if (firstError)
				return fail(500, {
					error: toUserError('One or more updates failed', firstError.message)
				});
		}

		return {
			success: true,
			message: `Import complete: ${toInsert.length} inserted, ${toUpdate.length} updated, ${skipped} skipped.`
		};
	}
};
