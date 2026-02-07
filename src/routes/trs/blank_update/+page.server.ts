import { fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function load({ url }) {
	const blank_no = url.searchParams.get('blank_no');
	const id = url.searchParams.get('id');
	const success = url.searchParams.get('success');
	const hasBlankNo = blank_no ? /^\d+$/.test(blank_no) : false;

	if (id) {
		const { data: blank, error } = await supabase
			.from('blank_stock')
			.select('*')
			.eq('id', id)
			.single();

		if (error || !blank) {
			return {
				blanks: [],
				blank: undefined,
				notFound: true
			};
		}
		return {
			blanks: [],
			blank,
			success: success === 'true'
		};
	}

	if (!hasBlankNo || !blank_no) {
		return {
			blanks: [],
			blank: undefined,
			success: success === 'true'
		};
	}

	const { data: blanks, error } = await supabase
		.from('blank_stock')
		.select('*')
		.eq('blank_no', blank_no)
		.order('id', { ascending: false });

	if (error || !blanks || blanks.length === 0) {
		return {
			blanks: [],
			blank: undefined,
			notFound: true
		};
	}

	if (blanks.length === 1) {
		return {
			blanks: [],
			blank: blanks[0],
			success: success === 'true'
		};
	}

	return {
		blank_no,
		blanks,
		blank: undefined,
		success: success === 'true'
	};
}

export const actions = {
	default: async ({ request }) => {
		const f = Object.fromEntries(await request.formData());

		if (!f.id) {
			return fail(400, { error: 'Row ID missing. Cannot update' });
		}

		const payload = {
			received_date: f.received_date || null,
			job_no: f.job_no || null,
			job_card_no: f.job_card_no || null,
			model_no: f.model_no || null,
			remarks: f.remarks || null
		};

		const { error } = await supabase.from('blank_stock').update(payload).eq('id', f.id);

		if (error) {
			return fail(500, { error: error.message });
		}

		throw redirect(303, '/trs/blank_update?success=true');
	}
};
