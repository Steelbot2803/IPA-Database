import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/supabaseServer';
import { toUserError } from '$lib/utils/userError';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const TITLE = 'PRODUCTION PLAN - TRANSDUCER';
const FORM_NUMBER = 'FORM NO.: R-PP-05/01-TRS';
const HEADERS = ['JOB NO.', 'CUSTOMER', 'MODEL', 'QTY', 'PLANNEDDATE', 'ACTUALDATE', 'REMARKS'];

type ExportRow = {
	job_no: string | null;
	customer: string | null;
	model_no: string | null;
	quantity: number | null;
	planned_dispatch: string | null;
	actual_dispatch: string | null;
	remarks: string | null;
};

function escapeCsvCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	const text = String(value);
	if (/[",\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function formatDate(value: string | null): string {
	if (!value) return '';
	return value;
}

function normalizeRow(row: ExportRow): string[] {
	return [
		row.job_no ?? '',
		row.customer ?? '',
		row.model_no ?? '',
		row.quantity === null ? '' : String(row.quantity),
		formatDate(row.planned_dispatch),
		formatDate(row.actual_dispatch),
		row.remarks ?? ''
	];
}

async function buildPdf(rows: string[][], titleYear: string): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([1200, 700]);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const pageWidth = page.getWidth();
	const pageHeight = page.getHeight();
	const marginX = 30;
	const tableWidth = pageWidth - marginX * 2;
	const titleFontSize = 28;
	const formFontSize = 16;
	const headerFontSize = 12;
	const bodyFontSize = 11;
	const headerRowHeight = 30;
	const bodyRowHeight = 24;
	const titleBlockHeight = 82;

	const dataRows = rows.map((row) => row.map((cell) => (cell ?? '').toString()));

	const widestByColumn = HEADERS.map((header, colIdx) => {
		let widest = fontBold.widthOfTextAtSize(header, headerFontSize) + 20;
		for (const row of dataRows) {
			const width = font.widthOfTextAtSize(row[colIdx] ?? '', bodyFontSize) + 20;
			if (width > widest) widest = width;
		}
		return widest;
	});

	const remarksWidth = Math.max(...widestByColumn.slice(0, 6));
	const widthWeights = [...widestByColumn.slice(0, 6), remarksWidth];
	const totalWeight = widthWeights.reduce((sum, value) => sum + value, 0) || 1;
	const colWidths = widthWeights.map((value) => (value / totalWeight) * tableWidth);

	const startX = marginX;
	let y = pageHeight - 26;

	page.drawRectangle({
		x: startX,
		y: y - titleBlockHeight,
		width: tableWidth,
		height: titleBlockHeight,
		borderColor: rgb(0.2, 0.2, 0.2),
		borderWidth: 1,
		color: rgb(0.84, 0.91, 0.98)
	});

	const titleText = `${TITLE} ${titleYear}`;
	const titleWidth = fontBold.widthOfTextAtSize(titleText, titleFontSize);
	page.drawText(titleText, {
		x: startX + (tableWidth - titleWidth) / 2,
		y: y - 36,
		size: titleFontSize,
		font: fontBold,
		color: rgb(0.05, 0.2, 0.42)
	});

	const formWidth = fontBold.widthOfTextAtSize(FORM_NUMBER, formFontSize);
	page.drawText(FORM_NUMBER, {
		x: startX + (tableWidth - formWidth) / 2,
		y: y - 62,
		size: formFontSize,
		font: fontBold,
		color: rgb(0.05, 0.2, 0.42)
	});

	y -= titleBlockHeight;

	let x = startX;
	for (let col = 0; col < HEADERS.length; col += 1) {
		const width = colWidths[col];
		page.drawRectangle({
			x,
			y: y - headerRowHeight,
			width,
			height: headerRowHeight,
			borderColor: rgb(0.2, 0.2, 0.2),
			borderWidth: 1,
			color: rgb(0.7, 0.86, 0.94)
		});
		const textWidth = fontBold.widthOfTextAtSize(HEADERS[col], headerFontSize);
		page.drawText(HEADERS[col], {
			x: x + (width - textWidth) / 2,
			y: y - 20,
			size: headerFontSize,
			font: fontBold,
			color: rgb(0.06, 0.06, 0.06)
		});
		x += width;
	}

	y -= headerRowHeight;

	for (const row of dataRows) {
		if (y - bodyRowHeight < 20) break;
		x = startX;
		for (let col = 0; col < HEADERS.length; col += 1) {
			const width = colWidths[col];
			page.drawRectangle({
				x,
				y: y - bodyRowHeight,
				width,
				height: bodyRowHeight,
				borderColor: rgb(0.2, 0.2, 0.2),
				borderWidth: 1
			});
			const value = row[col] ?? '';
			const textWidth = font.widthOfTextAtSize(value, bodyFontSize);
			const drawX = col === 6 ? x + 6 : x + Math.max(6, (width - textWidth) / 2);
			page.drawText(value.slice(0, 80), {
				x: drawX,
				y: y - 16,
				size: bodyFontSize,
				font,
				color: rgb(0, 0, 0)
			});
			x += width;
		}
		y -= bodyRowHeight;
	}

	return await pdf.save();
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const supabase = getSupabase(cookies);
	const scheduledMonth =
		url.searchParams.get('scheduled_month') ??
		`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
	const electromech = url.searchParams.get('electromech') === '1';
	const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
	const table = electromech ? 'trs_prod_plan_emech' : 'trs_prod_plan_main';
	const year = scheduledMonth.split('-')[0] ?? String(new Date().getFullYear());

	const { data, error } = await supabase
		.from(table)
		.select('job_no, customer, model_no, quantity, planned_dispatch, actual_dispatch, remarks')
		.eq('scheduled_month', scheduledMonth)
		.order('planned_dispatch', { ascending: true })
		.order('job_no', { ascending: true });

	if (error) {
		return new Response(
			toUserError(`Could not export production plan data from the ${table} table`, error.message),
			{
				status: 500
			}
		);
	}

	const normalizedRows = ((data ?? []) as ExportRow[]).map(normalizeRow);
	const suffix = electromech ? 'electromech' : 'main';

	if (format === 'pdf') {
		const bytes = await buildPdf(normalizedRows, year);
		return new Response(Buffer.from(bytes), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="production-plan-${scheduledMonth}-${suffix}.pdf"`
			}
		});
	}

	const lines = [[`${TITLE} ${year}`], [FORM_NUMBER], HEADERS, ...normalizedRows];
	const csvContent = lines.map((line) => line.map(escapeCsvCell).join(',')).join('\n');

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="production-plan-${scheduledMonth}-${suffix}.csv"`
		}
	});
};
