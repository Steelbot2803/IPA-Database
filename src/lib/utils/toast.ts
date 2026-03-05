import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
	remaining: number;
	timer?: ReturnType<typeof setTimeout>;
	start?: number;
}

const MAX_TOASTS = 4;

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	let toastIdCounter = 0;

	function show(message: string, type: ToastType = 'info', duration = 3000) {
		const id = toastIdCounter++;

		const toast: Toast = {
			id,
			message,
			type,
			duration,
			remaining: duration
		};

		update((toasts) => [...toasts.slice(-MAX_TOASTS + 1), toast]);

		startTimer(id);
	}

	function startTimer(id: number) {
		update((toasts) =>
			toasts.map((t) => {
				if (t.id !== id) return t;

				t.start = Date.now();
				t.timer = setTimeout(() => dismiss(id), t.remaining);
				return t;
			})
		);
	}

	function pause(id: number) {
		update((toasts) =>
			toasts.map((t) => {
				if (t.id !== id || !t.timer || !t.start) return t;

				clearTimeout(t.timer);
				t.remaining -= Date.now() - t.start;
				t.timer = undefined;
				t.start = undefined;
				return t;
			})
		);
	}

	function resume(id: number) {
		startTimer(id);
	}

	function dismiss(id: number) {
		update((toasts) => {
			toasts.find((t) => t.id === id)?.timer &&
				clearTimeout(toasts.find((t) => t.id === id)?.timer);
			return toasts.filter((t) => t.id !== id);
		});
	}

	return { subscribe, show, dismiss, pause, resume };
}

export const toast = createToastStore();
