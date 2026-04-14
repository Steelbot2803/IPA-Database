// PATH: src/routes/trs/lc_db/+page.server.ts
import { loadTablePage } from '$lib/utils/dbTableServer';

// NOTE on column naming: the database column is named `recieved_date` (misspelling
// is in the DB schema itself). The label shown to users is corrected to "Received Date".
// Do NOT rename this key — it must match the actual DB column name exactly.
const COLUMN_META = {
	derived_status: {
		type: 'enum',
		label: 'Status',
		values: ['BLANK-STOCK', 'IN-PROCESS', 'READY', 'DISPATCHED']
	},
	recieved_date: { type: 'date', label: 'Received Date' }, // ← DB column is misspelled; label is correct
	job_date: { type: 'date', label: 'Job Date' },
	job_no: { type: 'text', label: 'Job No' },
	job_card_no: { type: 'number', label: 'Job Card No' }, // ← added (was missing)
	model_no: { type: 'text', label: 'Model No' },
	blank_no: { type: 'number', label: 'Blank No' },
	serial_no: { type: 'number', label: 'Serial No' },
	customer: { type: 'text', label: 'Customer' } // ← added (was missing)
} as const;

// Reads always go through the view — the view joins trs_prod with derived columns
// (e.g. derived_status). Writes (update/insert) go directly to trs_prod instead.
export async function load({ url, locals }) {
	return loadTablePage({
		url,
		table: 'trs_prod_status_view',
		columnMeta: COLUMN_META,
		supabase: locals.supabase
	});
}
