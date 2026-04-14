// ─── CSV Import Utilities ─────────────────────────────────────────────────────
//
// The original code used `line.split(',')` which breaks whenever a field
// contains a comma (e.g. customer name "Smith, John" or any remarks text).
// This file implements a proper RFC 4180-compliant CSV parser that handles:
//   - Quoted fields:  "Smith, John"
//   - Escaped quotes: "He said ""hello"""
//   - Unquoted fields with no commas: MODEL-X
//
// No external dependency needed — keeps the bundle small.

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

// ─── RFC 4180 CSV parser ──────────────────────────────────────────────────────
// Parses a single CSV line into an array of cell strings, respecting:
//   - Quoted fields that may contain commas
//   - Doubled-quote escaping inside quoted fields ("" → ")
//   - Unquoted fields (trimmed)
function parseCsvLine(line: string): string[] {
	const cells: string[] = [];
	let i = 0;

	while (i <= line.length) {
		if (line[i] === '"') {
			// Quoted field — read until the closing unescaped quote
			let field = '';
			i++; // skip opening quote
			while (i < line.length) {
				if (line[i] === '"') {
					if (line[i + 1] === '"') {
						// Escaped quote ("") — emit a single " and skip both characters
						field += '"';
						i += 2;
					} else {
						// Closing quote
						i++;
						break;
					}
				} else {
					field += line[i];
					i++;
				}
			}
			cells.push(field);
			// Skip the comma separator (or end of line)
			if (line[i] === ',') i++;
		} else {
			// Unquoted field — read until the next comma
			const start = i;
			while (i < line.length && line[i] !== ',') i++;
			cells.push(line.slice(start, i).trim());
			if (line[i] === ',') i++;
		}
	}

	return cells;
}

function isValidDate(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parseImportCsv(rawText: string): ParseResult {
	// Normalise line endings (Windows CRLF → LF) then split
	const lines = rawText
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

	if (lines.length < 2) {
		return { ok: false, error: 'File must contain a header row and at least one data row.' };
	}

	// Parse the header row with the same quoted-field parser so headers with
	// unusual characters still work, then normalise to lowercase.
	const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

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
		// Use the proper parser instead of split(',')
		const cells = parseCsvLine(lines[i]);

		// Map cells back to their header names
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
				// Plain text field — value is already the parsed string from parseCsvLine
				(parsed as Record<string, unknown>)[field] = rawVal;
			}
		}

		rows.push(parsed as ParsedRow);
	}

	return { ok: true, rows };
}
