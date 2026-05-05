// PATH: src/routes/trs/lc_db/export/+server.ts
import type { RequestHandler } from './$types';
import { toUserError } from '$lib/utils/userError';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { requireUser } from '$lib/utils/auth';
import { parseFilters, applyFilter } from '$lib/utils/dbTableServer';
import { _COLUMN_META } from '../+page.server';
import type { Filter } from '$lib/utils/dbTableServer';

// ─── Column registry ──────────────────────────────────────────────────────────
// Every exportable column lives here. The key is the DB column name;
// the label is what appears in file headers.
// These must exactly match what trs_prod_status_view returns.
import { _ALL_EXPORT_COLUMNS } from '../exportColumns';

// Set of valid column keys — used to validate the ?columns= param
const VALID_KEYS = new Set(_ALL_EXPORT_COLUMNS.map(([key]) => key));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Safely wraps a CSV cell value: quotes any value containing a comma, quote, or newline.
function escapeCsvCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	const text = String(value);
	if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
	return text;
}

// pdf-lib's built-in fonts use WinAnsiEncoding (ISO 8859-1).
// Characters outside that range cause silent encoding errors — replace common ones.
function sanitizePdfText(text: string): string {
	return text
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2013\u2014]/g, '-')
		.replace(/\u2026/g, '...')
		.replace(/[\r\n]+/g, ' ')
		.replace(/[^\x00-\xFF]/g, '?');
}

// Extract cell values for a row in the order of the selected columns.
function normalizeRow(
	row: Record<string, unknown>,
	columns: [string, string][]
): string[] {
	return columns.map(([key]) => {
		const val = row[key];
		return val === null || val === undefined ? '' : String(val);
	});
}

// ─── PDF builder ─────────────────────────────────────────────────────────────
// Builds a well-laid-out PDF where:
//   - Page width scales with the number of columns (min 800px, max 3000px)
//   - Each column gets a proportional width based on its widest content
//   - Text that is too wide for a cell is truncated with "…" rather than overflowing
async function buildPdf(
	rows: string[][],
	headers: string[],
	title = 'LOADCELL DATABASE EXPORT'
): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();

	// ── Font setup ──
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

	// ── Sizing constants ──
	const HEADER_FONT_SIZE = 9;
	const BODY_FONT_SIZE = 8;
	const TITLE_FONT_SIZE = 16;
	const MARGIN_X = 30;
	const HEADER_ROW_H = 26;
	const BODY_ROW_H = 18;
	const TITLE_BLOCK_H = 44;
	const PAGE_HEIGHT = 700; // landscape height
	const MIN_COL_WIDTH = 40;
	const CELL_PAD = 14; // horizontal padding inside each cell (7px each side)

	// ── Measure natural column widths ──
	// For each column, we measure how wide the widest cell content is (in points).
	// We add CELL_PAD so text doesn't butt up against cell borders.
	const naturalWidths = headers.map((header, ci) => {
		let widest =
			fontBold.widthOfTextAtSize(sanitizePdfText(header), HEADER_FONT_SIZE) + CELL_PAD;
		for (const row of rows) {
			const w =
				font.widthOfTextAtSize(sanitizePdfText(row[ci] ?? ''), BODY_FONT_SIZE) + CELL_PAD;
			if (w > widest) widest = w;
		}
		return Math.max(widest, MIN_COL_WIDTH);
	});

	// ── Calculate page width from content ──
	// We want total table width = sum of column widths + margins.
	// Clamp between sensible bounds so the PDF isn't absurdly wide or too narrow.
	const totalNatural = naturalWidths.reduce((a, b) => a + b, 0);
	const rawPageWidth = totalNatural + MARGIN_X * 2;
	const PAGE_WIDTH = Math.min(Math.max(rawPageWidth, 800), 3000);
	const TABLE_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

	// ── Scale column widths to fill TABLE_WIDTH exactly ──
	// Each column gets a proportional share of the available table width.
	const scaleFactor = TABLE_WIDTH / (totalNatural || 1);
	const colWidths = naturalWidths.map((w) => w * scaleFactor);

	// ── Helper: truncate text to fit inside a column with an ellipsis ──
	function fitText(text: string, maxWidth: number, fontSize: number, isBold: boolean): string {
		const f = isBold ? fontBold : font;
		if (f.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
		// Binary-search-style trim — remove chars from end until it fits
		let truncated = text;
		while (truncated.length > 0 && f.widthOfTextAtSize(truncated + '…', fontSize) > maxWidth) {
			truncated = truncated.slice(0, -1);
		}
		return truncated + '…';
	}

	// ── Helper: draw the header row on a given page at a given Y position ──
	// Returns the new Y position after drawing the header.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function drawHeaders(pageObj: any, startY: number): number {
		let x = MARGIN_X;
		for (let ci = 0; ci < headers.length; ci++) {
			const w = colWidths[ci];
			pageObj.drawRectangle({
				x,
				y: startY - HEADER_ROW_H,
				width: w,
				height: HEADER_ROW_H,
				borderColor: rgb(0.2, 0.2, 0.2),
				borderWidth: 1,
				color: rgb(0.7, 0.86, 0.94)
			});
			const fitted = fitText(sanitizePdfText(headers[ci]), w - 6, HEADER_FONT_SIZE, true);
			const tw = fontBold.widthOfTextAtSize(fitted, HEADER_FONT_SIZE);
			pageObj.drawText(fitted, {
				x: x + Math.max(3, (w - tw) / 2),
				y: startY - HEADER_ROW_H + 9,
				size: HEADER_FONT_SIZE,
				font: fontBold,
				color: rgb(0.06, 0.06, 0.06)
			});
			x += w;
		}
		return startY - HEADER_ROW_H;
	}

	// ── First page ──
	let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	let y = PAGE_HEIGHT - 20;

	// Title block
	page.drawRectangle({
		x: MARGIN_X,
		y: y - TITLE_BLOCK_H,
		width: TABLE_WIDTH,
		height: TITLE_BLOCK_H,
		borderColor: rgb(0.2, 0.2, 0.2),
		borderWidth: 1,
		color: rgb(0.84, 0.91, 0.98)
	});
	const titleFitted = fitText(sanitizePdfText(title), TABLE_WIDTH - 20, TITLE_FONT_SIZE, true);
	const titleW = fontBold.widthOfTextAtSize(titleFitted, TITLE_FONT_SIZE);
	page.drawText(titleFitted, {
		x: MARGIN_X + (TABLE_WIDTH - titleW) / 2,
		y: y - TITLE_BLOCK_H + 14,
		size: TITLE_FONT_SIZE,
		font: fontBold,
		color: rgb(0.05, 0.2, 0.42)
	});
	y -= TITLE_BLOCK_H;

	y = drawHeaders(page, y);

	// ── Body rows ──
	for (const row of rows) {
		// If the current page doesn't have room, add a new page with a fresh header
		if (y - BODY_ROW_H < 20) {
			page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
			y = PAGE_HEIGHT - 20;
			y = drawHeaders(page, y);
		}

		let x = MARGIN_X;
		for (let ci = 0; ci < headers.length; ci++) {
			const w = colWidths[ci];
			const rawVal = row[ci] ?? '';
			const displayVal = fitText(sanitizePdfText(rawVal), w - 6, BODY_FONT_SIZE, false);
			const tw = font.widthOfTextAtSize(displayVal, BODY_FONT_SIZE);

			page.drawRectangle({
				x,
				y: y - BODY_ROW_H,
				width: w,
				height: BODY_ROW_H,
				borderColor: rgb(0.7, 0.7, 0.7),
				borderWidth: 0.5
			});
			page.drawText(displayVal, {
				// Centre numeric/date columns; left-align text columns (last two are remarks/customer)
				x: x + Math.max(3, (w - tw) / 2),
				y: y - BODY_ROW_H + 5,
				size: BODY_FONT_SIZE,
				font,
				color: rgb(0, 0, 0)
			});
			x += w;
		}
		y -= BODY_ROW_H;
	}

	return await pdf.save();
}

// ─── Request handler ──────────────────────────────────────────────────────────
export const GET: RequestHandler = async ({ url, locals }) => {
	const supabase = locals.supabase;

	// Any logged-in user (including GUEST) can export — this is a read-only operation
	// and GUESTs are already allowed to view the lc_db page.
	requireUser(locals.user);

	const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
	const sort = url.searchParams.get('sort');
	const order = url.searchParams.get('order') !== 'desc';
	const filters = parseFilters<keyof typeof _COLUMN_META>(url.searchParams.get('filters'));

	// ── Column selection ──
	// The caller passes ?columns=key1,key2,... to choose which columns to export.
	// We validate each key against VALID_KEYS and fall back to ALL_EXPORT_COLUMNS
	// if the param is absent or entirely invalid.
	const columnsParam = url.searchParams.get('columns');
	let exportColumns: [string, string][] = _ALL_EXPORT_COLUMNS;
	if (columnsParam) {
		const requested = columnsParam
			.split(',')
			.map((k) => k.trim())
			.filter((k) => VALID_KEYS.has(k));
		if (requested.length > 0) {
			// Preserve the canonical order from ALL_EXPORT_COLUMNS
			exportColumns = _ALL_EXPORT_COLUMNS.filter(([key]) => requested.includes(key));
		}
	}

	// Build the SELECT string from whichever columns are selected
	const selectStr = exportColumns.map(([key]) => key).join(', ');

	// ── Paginated fetch (Supabase caps at 1000 rows per request) ──
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const allRows: any[] = [];
	let from = 0;
	const STEP = 1000;

	while (true) {
		let query = supabase.from('trs_prod_status_view').select(selectStr);

		if (sort && (sort in _COLUMN_META || sort === 'id')) {
			query = query.order(sort, { ascending: order }).order('id', { ascending: true });
		} else {
			query = query.order('id', { ascending: false });
		}

		for (const [column, filter] of Object.entries(filters) as [
			keyof typeof _COLUMN_META,
			Filter
		][]) {
			const meta = _COLUMN_META[column];
			if (!meta || !filter) continue;
			query = applyFilter(query, column, meta.type, filter);
		}

		query = query.range(from, from + STEP - 1);
		const { data, error } = await query;

		if (error) {
			return new Response(toUserError('Could not export loadcell data', error.message), {
				status: 500
			});
		}

		if (!data || data.length === 0) break;
		allRows.push(...data);
		if (data.length < STEP) break;
		from += STEP;
	}

	const normalizedRows = allRows.map((row) => normalizeRow(row, exportColumns));
	const headers = exportColumns.map(([, label]) => label);

	if (format === 'pdf') {
		const bytes = await buildPdf(normalizedRows, headers);
		return new Response(Buffer.from(bytes), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'attachment; filename="loadcell-export.pdf"'
			}
		});
	}

	// CSV: one header row then data rows
	const lines = [headers, ...normalizedRows];
	const csvContent = lines.map((line) => line.map(escapeCsvCell).join(',')).join('\n');

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="loadcell-export.csv"'
		}
	});
};