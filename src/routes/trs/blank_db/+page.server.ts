import { loadTablePage } from '$lib/utils/dbTableServer';

const COLUMN_META = {
	received_date: { type: 'date', label: 'Received Date' },
	job_no: { type: 'text', label: 'Job No' },
	job_card_no: { type: 'number', label: 'Job Card No' },
	model_no: { type: 'text', label: 'Model No' },
	blank_no: { type: 'number', label: 'Blank No' }
} as const;

export async function load({ url }) {
	return loadTablePage({
		url,
		table: 'blank_stock',
		columnMeta: COLUMN_META
	});
}
