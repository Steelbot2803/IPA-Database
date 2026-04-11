import type { RequestHandler } from './$types';

const HEADERS = [
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
];

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const exampleRow = [
		'1234567', // blank_no  — exactly 7 digits
		'100001', // serial_no — exactly 6 digits
		'2025-01-15', // job_date  — YYYY-MM-DD
		'2025-01-14', // received_date
		'JN-001', // job_no
		'1234', // job_card_no — leave blank if unknown
		'MODEL-X', // model_no
		'ACME Corp', // customer
		'Some remark', // remarks
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31',
		'2026-12-31'
	].join(',');

	const csvContent = [HEADERS.join(','), exampleRow].join('\n');

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="loadcell-import-template.csv"'
		}
	});
};
