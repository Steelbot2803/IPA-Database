import type { RequestHandler } from './$types';
import { toUserError } from '$lib/utils/userError';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { requireUser } from '$lib/utils/auth';
import { parseFilters, applyFilter } from '$lib/utils/dbTableServer';
import { _COLUMN_META } from '../+page.server';
import type { Filter } from '$lib/utils/dbTableServer';

// Column definitions: [db_column_key, display_label]
// These must match what trs_prod_status_view actually returns.
const EXPORT_COLUMNS: [string, string][] = [
	['derived_status', 'Status'],
	['received_date', 'Received Date'],
	['job_date', 'Job Date'],
	['job_no', 'Job No'],
	['job_card_no', 'Job Card No'],
	['model_no', 'Model No'],
	['blank_no', 'Blank No'],
	['serial_no', 'Serial No'],
	['customer', 'Customer'],
	['curing', 'Curing'],
	['post_curing', 'Post Curing'],
	['wiring', 'Wiring'],
	['tc0', 'TC0'],
	['cycling', 'Cycling'],
	['cabling', 'Cabling'],
	['trimming', 'Trimming'],
	['black_putty', 'Black Putty'],
	['bellow_welding', 'Bellow Welding'],
	['pocket_welding', 'Pocket Welding'],
	['sealing_side_1', 'Sealing Side 1'],
	['sealing_side_2', 'Sealing Side 2'],
	['linearity', 'Linearity'],
	['tc0_qc', 'TC0 QC'],
	['tinning', 'Tinning'],
	['ready_date', 'Ready Date'],
	['dispatch_date', 'Dispatch Date'],
	['remarks', 'Remarks']
];

// The column keys we SELECT from the view, joined for the Supabase query.
const SELECT_COLUMNS = EXPORT_COLUMNS.map(([key]) => key).join(', ');

// Safely wraps a cell value for CSV — handles commas, quotes, and newlines
// by wrapping in double-quotes and escaping internal quotes.
function escapeCsvCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	const text = String(value);
	if (/[",\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

// Replace common unicode characters with their WinAnsi equivalents
function sanitizePdfText(text: string): string {
	return text
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2013\u2014]/g, '-')
		.replace(/\u2026/g, '...')
		// Remove any remaining characters outside WinAnsi
		.replace(/[^\x00-\xFF]/g, '?');
}

// Takes a row object from Supabase and returns an array of cell strings
// in the same order as EXPORT_COLUMNS.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRow(row: Record<string, any>): string[] {
	return EXPORT_COLUMNS.map(([key]) => {
		const val = row[key];
		return val === null || val === undefined ? '' : String(val);
	});
}

// Builds a PDF using pdf-lib. One page, landscape-ish wide table.
// The logic here mirrors what prod_plan_db/export does.
async function buildPdf(rows: string[][], headers: string[]): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	let page = pdf.addPage([2400, 700]);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const pageWidth = page.getWidth();
	const marginX = 30;
	const tableWidth = pageWidth - marginX * 2;
	const headerFontSize = 9;
	const bodyFontSize = 8;
	const headerRowH = 28;
	const bodyRowH = 20;
	const titleBlockH = 50;

	// Measure each column's natural width from its header and data,
	// then scale all widths proportionally to fill tableWidth.
	const colNaturalWidths = headers.map((h, ci) => {
		let widest = fontBold.widthOfTextAtSize(sanitizePdfText(h), headerFontSize) + 12;
		for (const row of rows) {
			const w = font.widthOfTextAtSize(sanitizePdfText(row[ci] ?? ''), bodyFontSize) + 12;
			if (w > widest) widest = w;
		}
		return widest;
	});
	const totalNatural = colNaturalWidths.reduce((a, b) => a + b, 0) || 1;
	const colWidths = colNaturalWidths.map((w) => (w / totalNatural) * tableWidth);

	// Helper to draw headers
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const drawHeaders = (pageObj: any, startY: number) => {
		let x = marginX;
		for (let ci = 0; ci < headers.length; ci++) {
			const w = colWidths[ci];
			pageObj.drawRectangle({
				x,
				y: startY - headerRowH,
				width: w,
				height: headerRowH,
				borderColor: rgb(0.2, 0.2, 0.2),
				borderWidth: 1,
				color: rgb(0.7, 0.86, 0.94)
			});
			const sanitizedHeader = sanitizePdfText(headers[ci]);
			const tw = fontBold.widthOfTextAtSize(sanitizedHeader, headerFontSize);
			pageObj.drawText(sanitizedHeader, {
				x: x + Math.max(4, (w - tw) / 2),
				y: startY - 18,
				size: headerFontSize,
				font: fontBold,
				color: rgb(0.06, 0.06, 0.06)
			});
			x += w;
		}
		return startY - headerRowH;
	};

	let y = page.getHeight() - 26;
	page.drawRectangle({
		x: marginX,
		y: y - titleBlockH,
		width: tableWidth,
		height: titleBlockH,
		borderColor: rgb(0.2, 0.2, 0.2),
		borderWidth: 1,
		color: rgb(0.84, 0.91, 0.98)
	});
	const titleText = 'LOADCELL DATABASE EXPORT';
	const titleWidth = fontBold.widthOfTextAtSize(titleText, 20);
	page.drawText(titleText, {
		x: marginX + (tableWidth - titleWidth) / 2,
		y: y - 32,
		size: 20,
		font: fontBold,
		color: rgb(0.05, 0.2, 0.42)
	});
	y -= titleBlockH;

	y = drawHeaders(page, y);

	for (const row of rows) {
		if (y - bodyRowH < 20) {
			page = pdf.addPage([2400, 700]);
			y = page.getHeight() - 26;
			y = drawHeaders(page, y);
		}
		let x = marginX;
		for (let ci = 0; ci < headers.length; ci++) {
			const w = colWidths[ci];
			const val = sanitizePdfText(row[ci] ?? '');
			page.drawRectangle({
				x,
				y: y - bodyRowH,
				width: w,
				height: bodyRowH,
				borderColor: rgb(0.2, 0.2, 0.2),
				borderWidth: 1
			});
			const tw = font.widthOfTextAtSize(val, bodyFontSize);
			const drawX =
				ci === headers.length - 1
					? x + 4 // remarks: left-align
					: x + Math.max(4, (w - tw) / 2); // others: centre
			// Truncate long text to avoid overflow
			page.drawText(val.slice(0, 100), {
				x: drawX,
				y: y - 14,
				size: bodyFontSize,
				font,
				color: rgb(0, 0, 0)
			});
			x += w;
		}
		y -= bodyRowH;
	}

	return await pdf.save();
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const supabase = locals.supabase;

	// Any logged-in user (including GUEST) can export — read-only operation.
	// Remove this line if you want to restrict to USER/ADMIN only.
	requireUser(locals.user);

	const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
	const sort = url.searchParams.get('sort');
	const order = url.searchParams.get('order') !== 'desc';
	const filters = parseFilters<keyof typeof _COLUMN_META>(url.searchParams.get('filters'));

	// Fetch all matching rows via pagination to overcome Supabase's 1000 row max limit
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const allRows: any[] = [];
	let from = 0;
	const step = 1000;

	while (true) {
		let query = supabase.from('trs_prod_status_view').select(SELECT_COLUMNS);

		if (sort && (sort in _COLUMN_META || sort === 'id')) {
			query = query.order(sort, { ascending: order }).order('id', { ascending: true });
		} else {
			query = query.order('id', { ascending: false });
		}

		for (const [column, filter] of Object.entries(filters) as [keyof typeof _COLUMN_META, Filter][]) {
			const meta = _COLUMN_META[column];
			if (!meta || !filter) continue;
			query = applyFilter(query, column, meta.type, filter);
		}

		query = query.range(from, from + step - 1);
		const { data, error } = await query;

		if (error) {
			return new Response(toUserError('Could not export loadcell data', error.message), {
				status: 500
			});
		}

		if (!data || data.length === 0) break;
		allRows.push(...data);
		if (data.length < step) break;
		from += step;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const normalizedRows = allRows.map(normalizeRow);
	const headers = EXPORT_COLUMNS.map(([, label]) => label);

	if (format === 'pdf') {
		const bytes = await buildPdf(normalizedRows, headers);
		return new Response(Buffer.from(bytes), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="loadcell-export.pdf"`
			}
		});
	}

	// CSV: header row + data rows
	const lines = [headers, ...normalizedRows];
	const csvContent = lines.map((line) => line.map(escapeCsvCell).join(',')).join('\n');

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="loadcell-export.csv"`
		}
	});
};
