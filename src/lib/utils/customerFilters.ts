export function normalize(stringData: string | null | undefined) {
	return stringData?.toLowerCase().replace(/\s+/g,'').trim() ?? '';
}

export function isElectromech(electromech: string | null | undefined) {
	return normalize(electromech) === 'electromech';
}

export function isAjax(ajax: string | null | undefined) {
	return normalize(ajax) === 'ajax';
}

export function isAlstom(alstom: string | null | undefined) {
	return normalize(alstom) === 'alstom';
}
