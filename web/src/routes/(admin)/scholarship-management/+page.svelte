<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { API_URL } from '$lib/config';
	import { getToken } from '$lib/auth';

	type ScholarshipStatus = 'active' | 'closed' | 'suspended' | 'archived' | 'draft';

	interface Scholarship {
		scholarship_id: string;
		title: string;
		sponsor_name: string;
		type: string | null;
		purpose: string | null;
		total_amount: number;
		total_slot: number;
		application_deadline: string | null;
		status: ScholarshipStatus;
		created_at: string;
	}

	let scholarships = $state<Scholarship[]>([]);
	let loading = $state(true);
	let error = $state('');

	let searchQuery = $state('');
	let sponsorQuery = $state('');
	let statusFilter = $state('All Status');
	let deadlineFilter = $state('All Deadlines');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalScholarships = $state(0);
	const pageSize = 10;

	const statuses = ['All Status', 'Active', 'Closed', 'Suspended', 'Archived', 'Draft'];
	const deadlines = ['All Deadlines', 'Upcoming', 'Passed'];

	let searchTimeout: ReturnType<typeof setTimeout>;
	let sponsorTimeout: ReturnType<typeof setTimeout>;

	async function fetchScholarships() {
		loading = true;
		error = '';

		try {
			const token = getToken();
			const params = new SvelteURLSearchParams();
			params.set('page', String(currentPage));
			params.set('limit', String(pageSize));

			if (searchQuery.trim()) params.set('search', searchQuery.trim());
			if (sponsorQuery.trim()) params.set('sponsor', sponsorQuery.trim());
			if (statusFilter !== 'All Status') params.set('status', statusFilter.toLowerCase());
			if (deadlineFilter !== 'All Deadlines') params.set('deadline', deadlineFilter.toLowerCase());

			const res = await fetch(`${API_URL}/admin/scholarships?${params}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const data = await res.json();

			if (!data.success) {
				error = data.message;
				return;
			}

			scholarships = data.scholarships;
			totalPages = data.pagination.totalPages;
			totalScholarships = data.pagination.total;
		} catch {
			error = 'Failed to connect to server';
		} finally {
			loading = false;
		}
	}

	function formatAmount(amount: number): string {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);
	}

	function formatDeadline(dateStr: string | null): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function isDeadlinePassed(dateStr: string | null): boolean {
		if (!dateStr) return false;
		return new Date(dateStr) < new Date();
	}

	function formatType(type: string | null): string {
		if (!type) return '—';
		return type === 'merit_based' ? 'Merit-Based' : 'Skill-Based';
	}

	function formatPurpose(purpose: string | null): string {
		if (!purpose) return '—';
		return purpose === 'allowance' ? 'Allowance' : 'Tuition';
	}

	function onSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1;
			fetchScholarships();
		}, 300);
	}

	function onSponsorInput() {
		clearTimeout(sponsorTimeout);
		sponsorTimeout = setTimeout(() => {
			currentPage = 1;
			fetchScholarships();
		}, 300);
	}

	function onFilterChange() {
		currentPage = 1;
		fetchScholarships();
	}

	function goToPage(p: number) {
		currentPage = p;
		fetchScholarships();
	}

	onMount(() => {
		fetchScholarships();
	});

	const statusStyle: Record<string, { dot: string; text: string }> = {
		active: { dot: 'bg-green-500', text: 'text-green-600' },
		closed: { dot: 'bg-gray-400', text: 'text-gray-500' },
		suspended: { dot: 'bg-amber-400', text: 'text-amber-500' },
		archived: { dot: 'bg-red-400', text: 'text-red-500' },
		draft: { dot: 'bg-blue-400', text: 'text-blue-500' }
	};

	function getVisiblePages(): (number | '...')[] {
		if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
		if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
		if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
		return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
	}
</script>

<svelte:head>
	<title>iSkolar — Scholarship Management</title>
</svelte:head>

<!-- Page Title -->
<div class="mb-5">
	<h1 class="text-xl text-gray-800">Scholarship Management</h1>
	<p class="mt-0.5 text-xs text-gray-400">
		{totalScholarships} scholarship program{totalScholarships !== 1 ? 's' : ''} — All sponsors
	</p>
</div>

<!-- Content Card -->
<div class="rounded-xl bg-white p-6 shadow-sm">
	<!-- Filters -->
	<div class="mb-5 flex flex-wrap items-center gap-3">
		<!-- Title Search -->
		<div class="relative min-w-40 flex-1">
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				placeholder="Search by title..."
				bind:value={searchQuery}
				oninput={onSearchInput}
				class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-xs text-gray-600 placeholder:text-gray-400 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			/>
		</div>

		<!-- Sponsor Search -->
		<div class="relative min-w-36">
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
			</svg>
			<input
				type="text"
				placeholder="Filter by sponsor..."
				bind:value={sponsorQuery}
				oninput={onSponsorInput}
				class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-xs text-gray-600 placeholder:text-gray-400 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			/>
		</div>

		<!-- Status Filter -->
		<div class="relative">
			<select
				bind:value={statusFilter}
				onchange={onFilterChange}
				class="appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			>
				{#each statuses as s (s)}
					<option value={s}>{s}</option>
				{/each}
			</select>
			<svg
				class="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</div>

		<!-- Deadline Filter -->
		<div class="relative">
			<select
				bind:value={deadlineFilter}
				onchange={onFilterChange}
				class="appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			>
				{#each deadlines as d (d)}
					<option value={d}>{d}</option>
				{/each}
			</select>
			<svg
				class="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#3A52A6]"></div>
			<span class="ml-3 text-sm text-gray-400">Loading scholarships...</span>
		</div>
	{:else if error}
		<div class="py-12 text-center text-sm text-red-500">{error}</div>
	{:else}
		<!-- Table -->
		<table class="w-full">
			<thead>
				<tr class="border-b border-gray-100">
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Scholarship</th>
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Type / Purpose</th>
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Amount / Slots</th>
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Deadline</th>
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Status</th>
					<th class="pb-3 text-right text-[10px] uppercase tracking-wider text-gray-400">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50">
				{#each scholarships as s (s.scholarship_id)}
					<tr class="group transition-colors hover:bg-gray-50">
						<!-- Scholarship Title + Sponsor -->
						<td class="py-3.5 pr-4">
							<p class="text-sm text-gray-700">{s.title}</p>
							<p class="mt-0.5 text-xs text-gray-400">{s.sponsor_name}</p>
						</td>

						<!-- Type / Purpose -->
						<td class="py-3.5 pr-4">
							<p class="text-xs text-gray-600">{formatType(s.type)}</p>
							<p class="mt-0.5 text-xs text-gray-400">{formatPurpose(s.purpose)}</p>
						</td>

						<!-- Amount / Slots -->
						<td class="py-3.5 pr-4">
							<p class="text-xs text-gray-700">{formatAmount(s.total_amount)}</p>
							<p class="mt-0.5 text-xs text-gray-400">{s.total_slot} slot{s.total_slot !== 1 ? 's' : ''}</p>
						</td>

						<!-- Deadline -->
						<td class="py-3.5 pr-4">
							{#if s.application_deadline}
								<p class="text-xs {isDeadlinePassed(s.application_deadline) ? 'text-red-400' : 'text-gray-600'}">
									{formatDeadline(s.application_deadline)}
								</p>
								{#if isDeadlinePassed(s.application_deadline)}
									<p class="mt-0.5 text-[10px] text-red-400">Passed</p>
								{/if}
							{:else}
								<p class="text-xs text-gray-400">—</p>
							{/if}
						</td>

						<!-- Status -->
						<td class="py-3.5 pr-4">
							<span class="flex items-center gap-1.5 text-xs font-medium {statusStyle[s.status]?.text ?? 'text-gray-500'}">
								<span class="inline-block h-1.5 w-1.5 rounded-full {statusStyle[s.status]?.dot ?? 'bg-gray-400'}"></span>
								{s.status.charAt(0).toUpperCase() + s.status.slice(1)}
							</span>
						</td>

						<!-- Actions -->
						<td class="py-3.5">
							<div class="flex items-center justify-end">
								<a
									href={resolve('/scholarship-management') + `/${s.scholarship_id}`}
									title="View & Manage"
									class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6]"
								>
									<svg
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</a>
							</div>
						</td>
					</tr>
				{/each}

				{#if scholarships.length === 0}
					<tr>
						<td colspan="6" class="py-12 text-center text-sm text-gray-400">
							No scholarships match the current filters.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-5 flex items-center justify-end gap-1">
				<button
					onclick={() => { if (currentPage > 1) goToPage(currentPage - 1); }}
					disabled={currentPage === 1}
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6] disabled:cursor-not-allowed disabled:opacity-40"
				>
					&lt;
				</button>

				{#each getVisiblePages() as p (p)}
					{#if p === '...'}
						<span class="flex h-7 w-7 items-center justify-center text-xs text-gray-400">…</span>
					{:else}
						<button
							onclick={() => { goToPage(p as number); }}
							class="flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-all
							{currentPage === p
								? 'border-[#3A52A6] bg-[#3A52A6] text-white'
								: 'border-gray-200 text-gray-500 hover:border-[#3A52A6] hover:text-[#3A52A6]'}"
						>
							{p}
						</button>
					{/if}
				{/each}

				<button
					onclick={() => { if (currentPage < totalPages) goToPage(currentPage + 1); }}
					disabled={currentPage === totalPages}
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6] disabled:cursor-not-allowed disabled:opacity-40"
				>
					&gt;
				</button>
			</div>
		{/if}
	{/if}
</div>
