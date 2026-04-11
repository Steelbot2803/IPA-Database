export const IMPORT_HEADERS = [
	'blank_no',
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

const DATE_FIELDS = new Set([
	'job_date',
	'received_date',
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
]);

const NUMBER_FIELDS = new Set(['blank_no', 'serial_no', 'job_card_no']);

export type ParsedRow = {
	blank_no: number | null;
	serial_no: number | null;
	job_date: string | null;
	received_date: string | null;
	job_no: string | null;
	job_card_no: number | null;
	model_no: string | null;
	customer: string | null;
	remarks: string | null;
	wiring: string | null;
	tc0: string | null;
	cycling: string | null;
	cabling: string | null;
	trimming: string | null;
	black_putty: string | null;
	bellow_welding: string | null;
	pocket_welding: string | null;
	sealing_side_1: string | null;
	sealing_side_2: string | null;
	linearity: string | null;
	tc0_qc: string | null;
	tinning: string | null;
	ready_date: string | null;
	dispatch_date: string | null;
};

export type ParseResult = { ok: true; rows: ParsedRow[] } | { ok: false; error: string };

function isValidDate(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

export function parseImportCsv(rawText: string): ParseResult {
	const lines = rawText
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

	if (lines.length < 2) {
		return { ok: false, error: 'File must contain a header row and at least one data row.' };
	}

	const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

	const validHeaderSet = new Set(IMPORT_HEADERS as readonly string[]);
	for (const h of headers) {
		if (!validHeaderSet.has(h)) {
			return {
				ok: false,
				error: `Unrecognized column header: "${h}". Check the template for valid headers.`
			};
		}
	}

	if (!headers.includes('blank_no') && !headers.includes('serial_no')) {
		return {
			ok: false,
			error: 'CSV must include at least a "blank_no" or "serial_no" column.'
		};
	}

	const rows: ParsedRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const cells = lines[i].split(',').map((c) => c.trim());
		const raw: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			raw[headers[j]] = cells[j] ?? '';
		}

		const parsed: Partial<ParsedRow> = {};

		for (const field of IMPORT_HEADERS) {
			const rawVal = raw[field] ?? '';

			if (rawVal === '') {
				(parsed as Record<string, unknown>)[field] = null;
				continue;
			}

			if (NUMBER_FIELDS.has(field)) {
				if (!/^\d+$/.test(rawVal)) {
					return {
						ok: false,
						error: `Row ${i + 1}: "${field}" must be a whole number, got "${rawVal}".`
					};
				}
				if (field === 'blank_no' && rawVal.length !== 7) {
					return {
						ok: false,
						error: `Row ${i + 1}: "blank_no" must be exactly 7 digits, got "${rawVal}".`
					};
				}
				if (field === 'serial_no' && rawVal.length !== 6) {
					return {
						ok: false,
						error: `Row ${i + 1}: "serial_no" must be exactly 6 digits, got "${rawVal}".`
					};
				}
				(parsed as Record<string, unknown>)[field] = Number(rawVal);
			} else if (DATE_FIELDS.has(field)) {
				if (!isValidDate(rawVal)) {
					return {
						ok: false,
						error: `Row ${i + 1}: "${field}" must be a date in YYYY-MM-DD format, got "${rawVal}".`
					};
				}
				(parsed as Record<string, unknown>)[field] = rawVal;
			} else {
				(parsed as Record<string, unknown>)[field] = rawVal;
			}
		}

		rows.push(parsed as ParsedRow);
	}

	return { ok: true, rows };
}
