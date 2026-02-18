import { loadTablePage } from '$lib/utils/dbTableServer';

const COLUMN_META = {
	derived_status: {
		type: 'enum',
		label: 'Status',
		values: ['BLANK-STOCK', 'IN-PROCESS', 'READY', 'DISPATCHED']
	},
	recieved_date: { type: 'date', label: 'Recieved Date' },
	job_date: { type: 'date', label: 'Job Date' },
	job_no: { type: 'text', label: 'Job No' },
	model_no: { type: 'text', label: 'Model No' },
	blank_no: { type: 'number', label: 'Blank No' },
	serial_no: { type: 'number', label: 'Serial No' }
} as const;

export async function load({ url }) {
	return loadTablePage({
		url,
		table: 'trs_prod_status_view',
		columnMeta: COLUMN_META
	});
}
