import type { RequestHandler } from './$types';
import { toUserError } from '$lib/utils/userError';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { requireUser } from '$lib/utils/auth';

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
	// Loadcell has many columns, so we use a very wide page
	const page = pdf.addPage([2400, 700]);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const pageWidth = page.getWidth();
	const pageHeight = page.getHeight();
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
		let widest = fontBold.widthOfTextAtSize(h, headerFontSize) + 12;
		for (const row of rows) {
			const w = font.widthOfTextAtSize(row[ci] ?? '', bodyFontSize) + 12;
			if (w > widest) widest = w;
		}
		return widest;
	});
	const totalNatural = colNaturalWidths.reduce((a, b) => a + b, 0) || 1;
	const colWidths = colNaturalWidths.map((w) => (w / totalNatural) * tableWidth);

	// Draw title block at top of page
	let y = pageHeight - 26;
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

	// Draw column header row
	let x = marginX;
	for (let ci = 0; ci < headers.length; ci++) {
		const w = colWidths[ci];
		page.drawRectangle({
			x,
			y: y - headerRowH,
			width: w,
			height: headerRowH,
			borderColor: rgb(0.2, 0.2, 0.2),
			borderWidth: 1,
			color: rgb(0.7, 0.86, 0.94)
		});
		const tw = fontBold.widthOfTextAtSize(headers[ci], headerFontSize);
		page.drawText(headers[ci], {
			x: x + Math.max(4, (w - tw) / 2),
			y: y - 18,
			size: headerFontSize,
			font: fontBold,
			color: rgb(0.06, 0.06, 0.06)
		});
		x += w;
	}
	y -= headerRowH;

	// Draw data rows — stop if we'd go off the bottom of the page
	for (const row of rows) {
		if (y - bodyRowH < 20) break;
		x = marginX;
		for (let ci = 0; ci < headers.length; ci++) {
			const w = colWidths[ci];
			const val = row[ci] ?? '';
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
			page.drawText(val.slice(0, 60), {
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

	// Re-use the same filter/sort params that the DB page uses so the export
	// matches what the user is currently viewing.
	// For now we export ALL rows (no pagination limit) — adjust if the table
	// grows very large and you need to cap it.
	const { data, error } = await supabase
		.from('trs_prod_status_view')
		.select(SELECT_COLUMNS)
		.order('id', { ascending: false })
		.limit(5000); // safety cap: prevents enormous exports

	if (error) {
		return new Response(toUserError('Could not export loadcell data', error.message), {
			status: 500
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const normalizedRows = ((data ?? []) as Record<string, any>[]).map(normalizeRow);
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
