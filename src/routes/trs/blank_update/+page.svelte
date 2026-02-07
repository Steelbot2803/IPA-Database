<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from '$lib/utils/toast';
	import { onMount } from 'svelte';
	import { History, Database } from 'lucide-svelte';

	const initialBlankNo = page.url.searchParams.get('blank_no') ?? '';
	let searchValue = initialBlankNo;
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let suggestionTimer: ReturnType<typeof setTimeout> | undefined;
	let suggestionAbortController: AbortController | undefined;
	let lastSearchQuery = '';
	let isSearchFocused = false;
	let showSuggestion = false;
	let dbSuggestion: string[] = [];
	let searchHistory: string[] = [];
	let searchInputEl: HTMLInputElement | null = null;
	let searching = false;
	let saving = false;
	let lastNotFoundQuery = '';
	let lastSuccessQuery = '';

	const SEARCH_HISTORY_KEY = 'trs-blank-update-search-history';
	const MAX_HISTORY = 8;
	const MIN_BLANK_SEARCH_LEN = 7;

	type SuggestionOption = {
		value: string;
		source: 'history' | 'database';
	};

	$: normalizedSearch = searchValue.trim();

	$: suggestionOptions = [
		...searchHistory.map((value) => ({ value, source: 'history' as const })),
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

	function loadSearchHistory() {
		if (typeof localStorage === 'undefined') return;

		const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
		if (!stored) return;

		try {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				searchHistory = parsed.filter((value) => typeof value === 'string').slice(0, MAX_HISTORY);
			}
		} catch {
			searchHistory = [];
		}
	}

	function saveSearch(value: string) {
		const cleaned = value.trim();
		if (!cleaned || typeof localStorage === 'undefined') return;

		searchHistory = [cleaned, ...searchHistory.filter((entry) => entry !== cleaned)].slice(
			0,
			MAX_HISTORY
		);
		localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
	}

	async function loadDbSuggestions(term: string) {
		if (suggestionAbortController) suggestionAbortController.abort;

		suggestionAbortController = new AbortController();
		const params = new URLSearchParams({ q: term, limit: '10' });

		try {
			const res = await fetch(`/trs/blank_update?${params.toString}`, {
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
		suggestionTimer = setTimeout(() => {
			loadDbSuggestions(normalizedSearch);
		}, 180);
	}

	function applySuggestion(option: SuggestionOption) {
		searchValue = option.value;
		isSearchFocused = false;
		showSuggestions = false;
		searchInputEl?.blur();
	}

	function runReactiveSearch(query: string, historyValue = '') {
		if (query === page.url.searchParams.toString()) {
			searching = false;
			return;
		}

		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			searching = true;
			saveSearch(historyValue);
			await goto(query ? `${page.url.pathname}?${query}` : page.url.pathname, {
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
			searching = false;
		}, 250);
	}

	$: {
		const trimmedValue = normalizedSearch;
		if (trimmedValue && trimmedValue.length < MIN_BLANK_SEARCH_LEN) {
			searching = false;
		} else {
			const query = trimmedValue ? `blank_no=${encodeURIComponent(trimmedValue)}` : '';
			const currentQuery = page.url.searchParams.toString();

			if (query !== lastSearchQuery && query !== currentQuery) {
				lastSearchQuery = query;
				runReactiveSearch(query, trimmedValue);
			}
		}
	}

	export let data;

	$: {
		const currentQuery = page.url.searchParams.toString();
		const queryBlankNo = page.url.searchParams.get('blank_no') ?? '';
		const isToastEligible = queryBlankNo.length >= MIN_BLANK_SEARCH_LEN;

		if (data.notFound && currentQuery && isToastEligible && lastNotFoundQuery !== currentQuery) {
			lastNotFoundQuery = currentQuery;
			toast.show(`No Blank entry against Blank No ${queryBlankNo}`, 'error', 5000);
		}

		if (data.success && lastSuccessQuery !== currentQuery) {
			lastSuccessQuery = currentQuery;
			toast.show('Blank entry updated successfully', 'success', 5000);
		}
	}

	async function handleSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		const trimmedValue = normalizedSearch;
		if (trimmedValue && trimmedValue.length < MIN_BLANK_SEARCH_LEN) {
			toast.show('Enter at least 7 digits for Blank No search', 'info', 3000);
			return;
		}
		const query = trimmedValue ? `blank_no=${encodeURIComponent(trimmedValue)}` : '';
		lastSearchQuery = query;
		runReactiveSearch(query, trimmedValue);
	}

	type Blank = {
		id: string;
		received_date: Date;
		job_no: string;
		job_card_no: number | null;
		model_no: string;
		blank_no: number;
		remarks: string | null;
	};

	onMount(() => {
		loadSearchHistory();
	});
</script>

<div class={uiStyles.c0069}>
	<h1 class={uiStyles.c0021}>Blank Update</h1>

	<form name="search" method="GET" class={uiStyles.c0070} onsubmit={handleSearchSubmit}>
		<div class={uiStyles.c0073}>
			<input
				type="text"
				inputmode="numeric"
				pattern="\d*"
				class={uiStyles.c0074}
				bind:this={searchInputEl}
				bind:value={searchValue}
				onfocus={() => (isSearchFocused = true)}
				onblur={() => setTimeout(() => (isSearchFocused = false), 120)}
				placeholder="Enter Blank No"
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

			<button class={uiStyles.c0078} disabled={searching}>
				{searching ? 'Searching...' : 'Refresh'}
			</button>
		</div>
	</form>

	{#if data.blanks && data.blanks.length >= 1}
		<div class={uiStyles.c0082}>
			<h2 class={uiStyles.c0083}>Multiple entries found — select one</h2>
			<div class={uiStyles.c0084}>
				<table class={uiStyles.c0085}>
					<thead class={uiStyles.c0086}>
						<tr>
							<th>Received Date</th>
							<th>Job No</th>
							<th>Model No</th>
							<th>Blank No</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.blanks as blank}
							<tr class={uiStyles.c0087}>
								<td class={uiStyles.c0088}>{blank.received_date}</td>
								<td>{blank.job_no}</td>
								<td>{blank.model_no}</td>
								<td>{blank.blank_no}</td>
								<td>
									<a href={`/trs/blank_update?id=${blank.id}`} class={uiStyles.c0089}> Edit </a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if data.blank}
		{@const blank: Blank = data.blank}

		<form
			name="blank_entry_update"
			method="POST"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					saving = false;
					await update();
				};
			}}
			class={uiStyles.c0090}
		>
			<input type="hidden" name="id" value={blank.id} />

			<section>
				<h2 class={uiStyles.c0091}>Core Details</h2>

				<div class={uiStyles.c0092}>
					<div class={uiStyles.c0045}>
						<label for="received_date" class={uiStyles.c0046}>Received Date</label>
						<input
							type="date"
							name="received_date"
							bind:value={blank.received_date}
							class={uiStyles.c0047}
						/>
					</div>

					<div class={uiStyles.c0045}>
						<label for="job_no" class={uiStyles.c0046}>Job No</label>
						<input type="text" name="job_no" bind:value={blank.job_no} class={uiStyles.c0047} />
					</div>

					<div class={uiStyles.c0045}>
						<label for="model_no" class={uiStyles.c0046}>Model No</label>
						<input type="text" name="model_no" bind:value={blank.model_no} class={uiStyles.c0047} />
					</div>

					<div class={uiStyles.c0045}>
						<label for="blank_no" class={uiStyles.c0046}>Blank No</label>
						<input
							name="blank_no"
							type="number"
							bind:value={blank.blank_no}
							disabled
							class={uiStyles.c0047}
						/>
					</div>
				</div>
			</section>

			<section>
				<h2 class={uiStyles.c0091}>Additional Details</h2>
				<div class={uiStyles.c0092}>
					<div class={uiStyles.c0045}>
						<label for="job_card_no" class={uiStyles.c0046}>Job Card No</label>
						<input
							name="job_card_no"
							type="number"
							bind:value={blank.job_card_no}
							placeholder={blank.job_card_no ? '' : 'Job Card No'}
							class={uiStyles.c0047}
						/>
					</div>

					<div class={uiStyles.c0107}>
						<label for="remarks" class={uiStyles.c0046}>Remarks</label>
						<textarea name="remarks" class={uiStyles.c0108}>{blank.remarks ?? ''}</textarea>
					</div>
				</div>
			</section>

			<div class={uiStyles.c0060}>
				<a href="/trs/blank_update" class={uiStyles.c0100}>Cancel</a>
				<button class={uiStyles.c0062} disabled={saving}>
					{saving ? 'Saving...' : 'Update Entry'}
				</button>
			</div>
		</form>
	{/if}
</div>
