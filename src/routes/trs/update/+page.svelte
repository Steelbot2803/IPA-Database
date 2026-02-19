<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { applyAction, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from '$lib/utils/toast.js';
	import { LOADCELL_PROCESS_DATE_FIELDS } from '$lib/utils/loadcellDates.js';
	import { onMount, tick } from 'svelte';
	import { History, Database, RefreshCw } from 'lucide-svelte';

	export let data;

	const initialBlankNo = page.url.searchParams.get('blank_no') ?? '';
	const initialSerialNo = page.url.searchParams.get('serial_no') ?? '';
	let saving = false;
	let searching = false;

	let searchMode: 'blank' | 'serial' = initialSerialNo ? 'serial' : 'blank';
	let searchValue = initialSerialNo || initialBlankNo;
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let suggestionTimer: ReturnType<typeof setTimeout> | undefined;
	let suggestionAbortController: AbortController | undefined;
	let lastSearchQuery = '';
	let isSearchFocused = false;
	let showSuggestions = false;
	let dbSuggestion: string[] = [];
	let blankSearchHistory: string[] = [];
	let serialSearchHistory: string[] = [];
	let searchInputEl: HTMLInputElement | null = null;
	let lastNotFoundQuery = '';

	const BLANK_SEARCH_HISTORY_KEY = 'trs-update-blank-search-history';
	const SERIAL_SEARCH_HISTORY_KEY = 'trs-update-serial-search-history';
	const MAX_HISTORY = 5;
	const MIN_BLANK_SEARCH_LEN = 7;
	const MIN_SERIAL_SEARCH_LEN = 6;

	type SuggestionOption = {
		value: string;
		source: 'history' | 'database';
	};

	$: normalizedSearch = searchValue.trim();

	$: activeSearchHistory = searchMode === 'blank' ? blankSearchHistory : serialSearchHistory;

	$: suggestionOptions = [
		...activeSearchHistory.map((value) => ({ value, source: 'history' as const })),
		...dbSuggestion.map((value) => ({ value, source: 'database' as const }))
	]
		.filter(
			(option, index, options) =>
				option.value && index === options.findIndex((entry) => entry.value === option.value)
		)
		.filter((option) =>
			normalizedSearch ? option.value.toLowerCase().includes(normalizedSearch.toLowerCase()) : true
		)
		.slice(0, 10);

	$: showSuggestions = isSearchFocused && suggestionOptions.length > 0;

	async function clearURLParams() {
		await goto(page.url.pathname, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
		await tick();
		await invalidateAll();
	}

	function parseHistoryValue(stored: string | null): string[] {
		if (!stored) return [];

		try {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				return parsed.filter((value) => typeof value === 'string').slice(0, MAX_HISTORY);
			}
		} catch {
			return [];
		}

		return [];
	}

	function loadSearchHistory() {
		if (typeof localStorage === 'undefined') return;

		blankSearchHistory = parseHistoryValue(localStorage.getItem(BLANK_SEARCH_HISTORY_KEY));
		serialSearchHistory = parseHistoryValue(localStorage.getItem(SERIAL_SEARCH_HISTORY_KEY));
	}

	function saveSearch(value: string) {
		const cleaned = value.trim();
		if (!cleaned || typeof localStorage === 'undefined') return;

		if (searchMode === 'blank') {
			blankSearchHistory = [
				cleaned,
				...blankSearchHistory.filter((entry) => entry !== cleaned)
			].slice(0, MAX_HISTORY);
			localStorage.setItem(BLANK_SEARCH_HISTORY_KEY, JSON.stringify(blankSearchHistory));
			return;
		}

		serialSearchHistory = [
			cleaned,
			...serialSearchHistory.filter((entry) => entry !== cleaned)
		].slice(0, MAX_HISTORY);
		localStorage.setItem(SERIAL_SEARCH_HISTORY_KEY, JSON.stringify(serialSearchHistory));
	}

	async function loadDbSuggestions(term: string, mode: 'blank' | 'serial') {
		if (suggestionAbortController) suggestionAbortController.abort();

		suggestionAbortController = new AbortController();

		const params = new URLSearchParams({
			mode,
			q: term,
			limit: '10'
		});

		try {
			const res = await fetch(`/trs/update?${params.toString()}`, {
				headers: { accept: 'application/json' },
				signal: suggestionAbortController.signal
			});

			if (!res.ok) {
				dbSuggestion = [];
				return;
			}

			const payload = await res.json();
			dbSuggestion = Array.isArray(payload?.suggestions)
				? payload.suggestions.map((value: number | string) => String(value))
				: [];
		} catch (error) {
			if ((error as Error).name !== 'AbortError') {
				dbSuggestion = [];
			}
		}
	}

	$: {
		if (suggestionTimer) clearTimeout(suggestionTimer);

		const mode = searchMode;
		suggestionTimer = setTimeout(() => {
			void loadDbSuggestions(normalizedSearch, mode);
		}, 180);
	}

	function setSearchMode(mode: 'blank' | 'serial') {
		if (searchMode === mode) return;

		searchMode = mode;
		dbSuggestion = [];
		lastSearchQuery = '';
	}

	function applySuggestion(option: SuggestionOption) {
		searchValue = option.value;
		isSearchFocused = false;
		showSuggestions = false;
		searchInputEl?.blur();
	}

	function showNotFoundToastForCurrentQuery() {
		const currentQuery = page.url.searchParams.toString();
		const queryValue =
			page.url.searchParams.get(searchMode === 'blank' ? 'blank_no' : 'serial_no') ?? '';
		const minLen = searchMode === 'blank' ? MIN_BLANK_SEARCH_LEN : MIN_SERIAL_SEARCH_LEN;
		const isToastEligible = queryValue.length >= minLen;

		if (
			page.data.notFound &&
			currentQuery &&
			isToastEligible &&
			lastNotFoundQuery !== currentQuery
		) {
			lastNotFoundQuery = currentQuery;
			toast.show(
				`No Loadcell entry against ${searchMode === 'blank' ? 'Blank No' : 'Serial No'} ${queryValue}`,
				'error',
				5000
			);
			clearURLParams();
		}
	}

	function runReactiveSearch(query: string, historyValue = '', forceRefresh = false) {
		if (!forceRefresh && query === page.url.searchParams.toString()) {
			searching = false;
			return;
		}

		if (searchTimer) clearTimeout(searchTimer);

		searchTimer = setTimeout(async () => {
			searching = true;
			saveSearch(historyValue);

			if (forceRefresh && query === page.url.searchParams.toString()) {
				await invalidateAll();
				await tick();
				showNotFoundToastForCurrentQuery();
				searching = false;
				return;
			}

			await goto(query ? `${page.url.pathname}?${query}` : page.url.pathname, {
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
			await tick();
			showNotFoundToastForCurrentQuery();
			searching = false;
		}, 250);
	}

	$: {
		const trimmedValue = normalizedSearch;
		const minLen = searchMode === 'blank' ? MIN_BLANK_SEARCH_LEN : MIN_SERIAL_SEARCH_LEN;
		if (trimmedValue && trimmedValue.length < minLen) {
			searching = false;
		} else {
			const query = trimmedValue
				? `${searchMode === 'blank' ? 'blank_no' : 'serial_no'}=${encodeURIComponent(trimmedValue)}`
				: '';
			const currentQuery = page.url.searchParams.toString();

			if (query !== lastSearchQuery && query !== currentQuery) {
				lastSearchQuery = query;
				runReactiveSearch(query, trimmedValue);
			}
		}
	}

	async function handleSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		const trimmedValue = normalizedSearch;
		const minLen = searchMode === 'blank' ? MIN_BLANK_SEARCH_LEN : MIN_SERIAL_SEARCH_LEN;
		if (trimmedValue && trimmedValue.length < minLen) {
			toast.show(
				`Enter at least ${minLen} digits for ${searchMode === 'blank' ? 'Blank No' : 'Serial No'} search`,
				'info',
				3000
			);
			return;
		}
		const query = trimmedValue
			? `${searchMode === 'blank' ? 'blank_no' : 'serial_no'}=${encodeURIComponent(trimmedValue)}`
			: '';
		lastSearchQuery = query;
		runReactiveSearch(query, trimmedValue, true);
	}

	type Job = {
		id: string;
		recieved_date: Date;
		job_date: Date;
		job_no: string;
		job_card_no: number | null;
		model_no: string;
		blank_no: number;
		serial_no: number | null;
		customer: string | null;
		remarks: string | null;

		wiring: Date | null;
		tc0: Date | null;
		cycling: Date | null;
		cabling: Date | null;
		trimming: Date | null;
		black_putty: Date | null;
		bellow_welding: Date | null;
		pocket_welding: Date | null;
		sealing_side_1: Date | null;
		sealing_side_2: Date | null;
		linearity: Date | null;
		tc0_qc: Date | null;
		tinning: Date | null;
		ready_date: Date | null;
		dispatch_date: Date | null;
	};

	const dateFields = LOADCELL_PROCESS_DATE_FIELDS.map(([field, label]) => [
		field as keyof Job,
		label
	]);

	onMount(() => {
		loadSearchHistory();
	});
</script>

<div class={uiStyles.c0069}>
	<h1 class={uiStyles.c0021}>Loadcell Update</h1>

	<!-- SEARCH -->
	<form name="search" method="GET" class={uiStyles.c0070} onsubmit={handleSearchSubmit}>
		<div>
			<button
				type="button"
				class={uiStyles.c0071}
				class:bg-neutral-800={searchMode === 'blank'}
				class:border-neutral-700={searchMode === 'serial'}
				class:text-neutral-100={searchMode === 'blank'}
				class:shadow-inner={searchMode === 'blank'}
				class:border-cyan-500={searchMode === 'blank'}
				onclick={() => setSearchMode('blank')}
				aria-pressed={searchMode === 'blank'}
			>
				Blank No
			</button>

			<button
				type="button"
				class={uiStyles.c0072}
				class:bg-neutral-800={searchMode === 'serial'}
				class:border-neutral-700={searchMode === 'blank'}
				class:text-neutral-100={searchMode === 'serial'}
				class:shadow-inner={searchMode === 'serial'}
				class:border-cyan-500={searchMode === 'serial'}
				onclick={() => setSearchMode('serial')}
				aria-pressed={searchMode === 'serial'}
			>
				Serial No
			</button>
		</div>
		<div class={uiStyles.c0073}>
			<input
				id="search_value"
				name="search_value"
				type="text"
				inputmode="numeric"
				pattern="\d*"
				class={uiStyles.c0074}
				bind:this={searchInputEl}
				bind:value={searchValue}
				onfocus={() => (isSearchFocused = true)}
				onblur={() => setTimeout(() => (isSearchFocused = false), 120)}
				placeholder={searchMode === 'blank' ? 'Enter Blank No' : 'Enter Serial No'}
			/>

			{#if showSuggestions}
				<div class={uiStyles.c0075}>
					{#each suggestionOptions as option}
						<button
							type="button"
							class={uiStyles.c0076}
							onmousedown={(event) => {
								event.preventDefault();
								applySuggestion(option);
							}}
						>
							<span>{option.value}</span>
							{#if option.source === 'history'}
								<span class={uiStyles.c0077}>
									<History size={20} />
								</span>
							{:else}
								<span class={uiStyles.c0077}>
									<Database size={20} />
								</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
			<div class={uiStyles.c0073}>
				<button class={uiStyles.c0078} disabled={searching}>
					{#if searching}
						<RefreshCw class="animate-spin" size="24" />
					{:else}
						<RefreshCw size="24" />
					{/if}
				</button>
			</div>
		</div>
	</form>

	<!-- IF DUPLICATE BLANK NO -->
	{#if data.jobs && data.jobs.length >= 1}
		<div class={uiStyles.c0082}>
			<h2 class={uiStyles.c0083}>Multiple entries found — select one</h2>
			<div class={uiStyles.c0084}>
				<table class={uiStyles.c0085}>
					<thead class={uiStyles.c0086}>
						<tr>
							<th>Recieved Date</th>
							<th>Job Date</th>
							<th>Job No</th>
							<th>Model No</th>
							<th>Blank No</th>
							<th>Serial No</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.jobs as job}
							<tr class={uiStyles.c0087}>
								<td class={uiStyles.c0088}>{job.recieved_date}</td>
								<td>{job.job_date}</td>
								<td>{job.job_no}</td>
								<td>{job.model_no}</td>
								<td>{job.blank_no}</td>
								<td>{job.serial_no ?? '—'}</td>
								<td>
									<a href={`/trs/update?id=${job.id}`} class={uiStyles.c0089}> Edit </a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- EDIT FORM -->
	{#if data.job}
		{@const job = data.job}

		<form
			name="loadcell_entry_update"
			method="POST"
			use:enhance={({ formData, cancel }) => {
				const modelNo = String(formData.get('model_no') ?? '').trim();
				const jobDate = String(formData.get('job_date') ?? '').trim();

				if (!jobDate) {
					toast.show('Missing Job Date', 'error', 5000);
					cancel();
					return;
				}

				if (!modelNo) {
					toast.show('Missing Model No', 'error', 5000);
					cancel();
					return;
				}

				return async ({ result }) => {
					try {
						if (result.type === 'failure' && result.data?.error) {
							toast.show(String(result.data.error), 'error', 5000);
						} else if (result.type === 'success' && result.data?.info) {
							toast.show(String(result.data.info), 'info', 5000);
						} else if (result.type === 'success' && result.data?.success) {
							toast.show('Loadcell entry updated successfully', 'success', 5000);
						}

						if (result.type === 'failure' && result.data?.error) {
							await clearURLParams();
							return;
						}

						if (result.type === 'success' && (result.data?.success || result.data?.info)) {
							await clearURLParams();
							return;
						}

						await applyAction(result);
					} finally {
						saving = false;
					}
				};
			}}
			class={uiStyles.c0090}
		>
			<input id="id" type="hidden" name="id" value={job.id} />

			<!-- CORE INFO -->
			<section>
				<h2 class={uiStyles.c0091}>Core Details</h2>

				<div class={uiStyles.c0092}>
					<div class={uiStyles.c0045}>
						<label for="blank_no" class={uiStyles.c0046}>Blank No</label>
						<input
							id="blank_no"
							name="blank_no"
							type="number"
							bind:value={job.blank_no}
							disabled
							class={uiStyles.c0068}
						/>
					</div>

					<div class={uiStyles.c0045}>
						<label for="recieved_date" class={uiStyles.c0046}>Recieved Date</label>
						<input
							id="recieved_date"
							type="date"
							name="recieved_date"
							bind:value={job.recieved_date}
							disabled
							class={uiStyles.c0068}
						/>
					</div>

					<div class={uiStyles.c0045}>
						<label for="job_date" class={uiStyles.c0046}>Job Date *</label>
						<input
							id="job_date"
							type="date"
							name="job_date"
							bind:value={job.job_date}
							class={uiStyles.c0047}
						/>
					</div>

					<div class={uiStyles.c0045}>
						<label for="job_no" class={uiStyles.c0046}>Job No</label>
						<input
							id="job_no"
							type="text"
							name="job_no"
							bind:value={job.job_no}
							class={uiStyles.c0047}
						/>
					</div>

					<div class={uiStyles.c0045}>
						<label for="serial_no" class={uiStyles.c0046}>Serial No</label>
						<input
							id="serial_no"
							name="serial_no"
							type="number"
							placeholder={job.serial_no ? '' : 'Serial No (6 digits)'}
							bind:value={job.serial_no}
							inputmode="numeric"
							pattern="\d{6}"
							class={uiStyles.c0047}
						/>
					</div>

					<div class={uiStyles.c0045}>
						<label for="model_no" class={uiStyles.c0046}>Model No *</label>
						<input
							id="model_no"
							type="text"
							name="model_no"
							bind:value={job.model_no}
							class={uiStyles.c0047}
						/>
					</div>

					<div class={uiStyles.c0045}>
						<label for="customer" class={uiStyles.c0046}>Customer</label>
						<textarea
							id="customer"
							name="customer"
							rows="1"
							bind:value={job.customer}
							placeholder={job.customer ? '' : 'Customer'}
							class={uiStyles.c0093}
						></textarea>
					</div>

					<div class={uiStyles.c0045}>
						<label for="job_card_no" class={uiStyles.c0046}>Job Card No</label>
						<input
							id="job_card_no"
							name="job_card_no"
							type="number"
							bind:value={job.job_card_no}
							placeholder={job.job_card_no ? '' : 'Job Card No'}
							class={uiStyles.c0047}
						/>
					</div>
				</div>
			</section>

			<!-- PROCESS DATES -->
			<section>
				<h2 class={uiStyles.c0091}>Process Dates</h2>
				<div class={uiStyles.c0094}>
					{#each dateFields as [field, label]}
						<label for={field} class={uiStyles.c0095}>{label}</label>
						<input
							type="date"
							id={field}
							name={field}
							bind:value={job[field]}
							placeholder={job[field] ? '' : label}
							class={uiStyles.c0096}
						/>
					{/each}
				</div>
			</section>

			<!-- REMARKS -->
			<section>
				<h2 class={uiStyles.c0097}>Remarks</h2>
				<div class={uiStyles.c0098}>
					<textarea id="remarks" placeholder="Remarks" name="remarks" class={uiStyles.c0099}
						>{job.remarks ?? ''}</textarea
					>
				</div>
			</section>

			<!-- ACTION -->
			<div class={uiStyles.c0060}>
				<a href="/trs/update" class={uiStyles.c0100}>Cancel</a>
				<button class={uiStyles.c0062} disabled={saving}>
					{saving ? 'Saving...' : 'Update Entry'}
				</button>
			</div>
		</form>
	{/if}
</div>
