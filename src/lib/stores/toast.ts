import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function show(message: string, type: ToastType = 'info', duration = 3000) {
		const id = Date.now();

		update((toasts) => [...toasts, { id, message, type, duration }]);

		setTimeout(() => dismiss(id), duration);
	}

	function dismiss(id: number) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return { subscribe, show, dismiss };
}

export const toast = createToastStore();
