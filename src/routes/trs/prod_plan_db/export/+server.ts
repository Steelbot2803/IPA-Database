// PATH: src/routes/trs/prod_plan_db/export/+server.ts
import type { RequestHandler } from './$types';
import { toUserError } from '$lib/utils/userError';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { requireUser } from '$lib/utils/auth';
import { parseFilters, applyFilter } from '$lib/utils/dbTableServer';
import { _COLUMN_META } from '../+page.server';
import type { Filter } from '$lib/utils/dbTableServer';

// ─── Column registry ──────────────────────────────────────────────────────────
// Every exportable column in the production plan tables.
// Keys must match the actual DB column names in trs_prod_plan_main / trs_prod_plan_emech.
import { _ALL_EXPORT_COLUMNS } from '../exportColumns';

const VALID_KEYS = new Set(_ALL_EXPORT_COLUMNS.map(([key]) => key));

const TITLE = 'PRODUCTION PLAN - TRANSDUCER';
const FORM_NUMBER = 'FORM NO.: R-PP-05/01-TRS';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsvCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	const text = String(value);
	if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
	return text;
}

function sanitizePdfText(text: string): string {
	return text
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2013\u2014]/g, '-')
		.replace(/\u2026/g, '...')
		.replace(/[\r\n]+/g, ' ')
		.replace(/[^\x00-\xFF]/g, '?');
}

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
// Same adaptive-width approach as lc_db/export — page width scales with column count.
async function buildPdf(
	rows: string[][],
	headers: string[],
	titleYear: string
): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const HEADER_FONT_SIZE = 10;
	const BODY_FONT_SIZE = 9;
	const TITLE_FONT_SIZE = 20;
	const FORM_FONT_SIZE = 13;
	const MARGIN_X = 30;
	const HEADER_ROW_H = 28;
	const BODY_ROW_H = 22;
	const TITLE_BLOCK_H = 68;
	const PAGE_HEIGHT = 700;
	const MIN_COL_WIDTH = 50;
	const CELL_PAD = 16;

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

	const totalNatural = naturalWidths.reduce((a, b) => a + b, 0);
	const rawPageWidth = totalNatural + MARGIN_X * 2;
	const PAGE_WIDTH = Math.min(Math.max(rawPageWidth, 800), 2200);
	const TABLE_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

	const scaleFactor = TABLE_WIDTH / (totalNatural || 1);
	const colWidths = naturalWidths.map((w) => w * scaleFactor);

	function fitText(text: string, maxWidth: number, fontSize: number, isBold: boolean): string {
		const f = isBold ? fontBold : font;
		if (f.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
		let truncated = text;
		while (truncated.length > 0 && f.widthOfTextAtSize(truncated + '…', fontSize) > maxWidth) {
			truncated = truncated.slice(0, -1);
		}
		return truncated + '…';
	}

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
				y: startY - HEADER_ROW_H + 10,
				size: HEADER_FONT_SIZE,
				font: fontBold,
				color: rgb(0.06, 0.06, 0.06)
			});
			x += w;
		}
		return startY - HEADER_ROW_H;
	}

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

	const titleText = `${TITLE} ${titleYear}`;
	const titleFitted = fitText(sanitizePdfText(titleText), TABLE_WIDTH - 20, TITLE_FONT_SIZE, true);
	const titleW = fontBold.widthOfTextAtSize(titleFitted, TITLE_FONT_SIZE);
	page.drawText(titleFitted, {
		x: MARGIN_X + (TABLE_WIDTH - titleW) / 2,
		y: y - 28,
		size: TITLE_FONT_SIZE,
		font: fontBold,
		color: rgb(0.05, 0.2, 0.42)
	});

	const formFitted = fitText(sanitizePdfText(FORM_NUMBER), TABLE_WIDTH - 20, FORM_FONT_SIZE, true);
	const formW = fontBold.widthOfTextAtSize(formFitted, FORM_FONT_SIZE);
	page.drawText(formFitted, {
		x: MARGIN_X + (TABLE_WIDTH - formW) / 2,
		y: y - 52,
		size: FORM_FONT_SIZE,
		font: fontBold,
		color: rgb(0.05, 0.2, 0.42)
	});

	y -= TITLE_BLOCK_H;
	y = drawHeaders(page, y);

	for (const row of rows) {
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
				x: x + Math.max(3, (w - tw) / 2),
				y: y - BODY_ROW_H + 7,
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

	// GUESTs can view the prod_plan_db page so they should be able to export too.
	// (requireRole is intentionally absent here — read-only export.)
	requireUser(locals.user);

	const scheduledMonth =
		url.searchParams.get('scheduled_month') ??
		`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
	const electromech = url.searchParams.get('electromech') === '1';
	const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
	const sort = url.searchParams.get('sort');
	const order = url.searchParams.get('order') !== 'desc';
	const filters = parseFilters<keyof typeof _COLUMN_META>(url.searchParams.get('filters'));
	const table = electromech ? 'trs_prod_plan_emech' : 'trs_prod_plan_main';
	const year = scheduledMonth.split('-')[0] ?? String(new Date().getFullYear());

	// ── Column selection ──
	const columnsParam = url.searchParams.get('columns');
	let exportColumns: [string, string][] = _ALL_EXPORT_COLUMNS;
	if (columnsParam) {
		const requested = columnsParam
			.split(',')
			.map((k) => k.trim())
			.filter((k) => VALID_KEYS.has(k));
		if (requested.length > 0) {
			exportColumns = _ALL_EXPORT_COLUMNS.filter(([key]) => requested.includes(key));
		}
	}

	const selectStr = exportColumns.map(([key]) => key).join(', ');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const allRows: any[] = [];
	let from = 0;
	const STEP = 1000;

	while (true) {
		let query = supabase
			.from(table)
			.select(selectStr)
			.eq('scheduled_month', scheduledMonth);

		if (sort && (sort in _COLUMN_META || sort === 'id')) {
			query = query.order(sort, { ascending: order }).order('id', { ascending: true });
		} else {
			query = query
				.order('planned_dispatch', { ascending: true })
				.order('job_no', { ascending: true });
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
			return new Response(toUserError('Could not export production plan data', error.message), {
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
	const suffix = electromech ? 'electromech' : 'main';

	if (format === 'pdf') {
		const bytes = await buildPdf(normalizedRows, headers, year);
		return new Response(Buffer.from(bytes), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="production-plan-${scheduledMonth}-${suffix}.pdf"`
			}
		});
	}

	// CSV: title/form header rows + column headers + data
	const lines = [
		[`${TITLE} ${year}`],
		[FORM_NUMBER],
		headers,
		...normalizedRows
	];
	const csvContent = lines.map((line) => line.map(escapeCsvCell).join(',')).join('\n');

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="production-plan-${scheduledMonth}-${suffix}.csv"`
		}
	});
};