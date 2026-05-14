<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchDashboardStats } from '$lib/api/admin';

	interface DashboardStats {
		totalUsers: number;
		totalStudents: number;
		totalSponsors: number;
		totalAdmins: number;
		totalScholarships: number;
		activeStudents: number;
		activeSponsors: number;
		activeScholarships: number;
		closedScholarships: number;
		archivedScholarships: number;
		totalApplications: number;
		approvedApplications: number;
		deniedApplications: number;
	}

	let stats = $state<DashboardStats | null>(null);
	let loading = $state(true);
	let refreshing = $state(false);
	let error = $state('');
	let lastRefreshed = $state<Date | null>(null);

	const REFRESH_INTERVAL_MS = 30_000;
	let intervalId: ReturnType<typeof setInterval>;

	async function fetchStats(isManual = false) {
		if (isManual) refreshing = true;
		try {
			const data = await fetchDashboardStats();
			if (!data.success) {
				error = data.message || 'Failed to load dashboard stats';
				return;
			}
			stats = data.stats;
			error = '';
			lastRefreshed = new Date();
		} catch {
			error = 'Network error. Retrying...';
		} finally {
			loading = false;
			refreshing = false;
		}
	}

	onMount(() => {
		fetchStats();
		intervalId = setInterval(() => fetchStats(), REFRESH_INTERVAL_MS);
	});

	onDestroy(() => {
		clearInterval(intervalId);
	});

	const actionShortcuts = [
		{ label: 'User List', href: '/user-management', icon: 'users' },
		{ label: 'Scholarship List', href: '/scholarship-management', icon: 'scholarship' },
		{ label: 'User Reports', href: '/user-reports', icon: 'reports' },
		{ label: 'Scholarship Reports', href: '/scholarship-reports', icon: 'bar-chart' }
	];

	function pct(part: number, total: number) {
		if (!total) return 0;
		return Math.round((part / total) * 100);
	}
</script>

<svelte:head>
	<title>iSkolar — Dashboard</title>
</svelte:head>

<!-- Header row -->
<div class="mb-6 flex items-center justify-between">
	<div>
		{#if lastRefreshed}
			<p class="text-[10px] text-gray-400">
				Last updated: {lastRefreshed.toLocaleTimeString()} · auto-refreshes every 30s
			</p>
		{/if}
	</div>
	<button
		onclick={() => fetchStats(true)}
		disabled={refreshing}
		class="flex items-center gap-2 rounded-lg bg-[#3A52A6] px-4 py-2 text-xs text-white shadow transition-all hover:bg-[#2d3f8a] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
	>
		<svg
			class="h-3.5 w-3.5 {refreshing ? 'animate-spin' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
			/>
		</svg>
		{refreshing ? 'Refreshing...' : 'Refresh'}
	</button>
</div>

{#if error}
	<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
		{error}
	</div>
{/if}

<!-- Stat Cards -->
<div class="grid grid-cols-5 gap-4">
	<!-- Total Registered Users -->
	<a
		href="/user-management"
		class="group flex flex-col gap-3 rounded-xl border-t-4 border-t-blue-500 bg-white p-5 shadow-sm transition-all hover:shadow-md"
	>
		<div class="flex h-9 w-9 items-center justify-center rounded-lg text-blue-500">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
			</svg>
		</div>
		<div>
			<p class="text-[10px] tracking-wide text-gray-400">TOTAL USERS</p>
			<p class="text-3xl font-light text-gray-800">
				{#if loading}—{:else}{stats?.totalUsers ?? 0}{/if}
			</p>
			<p class="mt-1 text-xs text-gray-400 group-hover:text-blue-500">View all →</p>
		</div>
	</a>

	<!-- Students -->
	<a
		href="/user-management"
		class="group flex flex-col gap-3 rounded-xl border-t-4 border-t-sky-500 bg-white p-5 shadow-sm transition-all hover:shadow-md"
	>
		<div class="flex h-9 w-9 items-center justify-center rounded-lg text-sky-500">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
			</svg>
		</div>
		<div>
			<p class="text-[10px] tracking-wide text-gray-400">STUDENTS</p>
			<p class="text-3xl font-light text-gray-800">
				{#if loading}—{:else}{stats?.totalStudents ?? 0}{/if}
			</p>
			<p class="mt-1 text-xs text-gray-400 group-hover:text-sky-500">View all →</p>
		</div>
	</a>

	<!-- Sponsors -->
	<a
		href="/user-management"
		class="group flex flex-col gap-3 rounded-xl border-t-4 border-t-amber-400 bg-white p-5 shadow-sm transition-all hover:shadow-md"
	>
		<div class="flex h-9 w-9 items-center justify-center rounded-lg text-amber-500">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
			</svg>
		</div>
		<div>
			<p class="text-[10px] tracking-wide text-gray-400">SPONSORS</p>
			<p class="text-3xl font-light text-gray-800">
				{#if loading}—{:else}{stats?.totalSponsors ?? 0}{/if}
			</p>
			<p class="mt-1 text-xs text-gray-400 group-hover:text-amber-500">View all →</p>
		</div>
	</a>

	<!-- Admins -->
	<a
		href="/user-management"
		class="group flex flex-col gap-3 rounded-xl border-t-4 border-t-violet-500 bg-white p-5 shadow-sm transition-all hover:shadow-md"
	>
		<div class="flex h-9 w-9 items-center justify-center rounded-lg text-violet-500">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
			</svg>
		</div>
		<div>
			<p class="text-[10px] tracking-wide text-gray-400">ADMINS</p>
			<p class="text-3xl font-light text-gray-800">
				{#if loading}—{:else}{stats?.totalAdmins ?? 0}{/if}
			</p>
			<p class="mt-1 text-xs text-gray-400 group-hover:text-violet-500">View all →</p>
		</div>
	</a>

	<!-- Scholarships Posted -->
	<a
		href="/scholarship-management"
		class="group flex flex-col gap-3 rounded-xl border-t-4 border-t-indigo-400 bg-white p-5 shadow-sm transition-all hover:shadow-md"
	>
		<div class="flex h-9 w-9 items-center justify-center rounded-lg text-indigo-500">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
		</div>
		<div>
			<p class="text-[10px] tracking-wide text-gray-400">SCHOLARSHIPS POSTED</p>
			<p class="text-3xl font-light text-gray-800">
				{#if loading}—{:else}{stats?.totalScholarships ?? 0}{/if}
			</p>
			<p class="mt-1 text-xs text-gray-400 group-hover:text-indigo-500">View all →</p>
		</div>
	</a>
</div>

<!-- Bottom Section -->
<div class="mt-4 flex gap-4">
	<!-- Stats Summary -->
	<div class="flex-1 rounded-xl bg-white p-5 shadow-sm">
		<h2 class="mb-4 text-sm text-gray-700">Platform Summary</h2>
		{#if loading}
			<div class="space-y-3">
				{#each [1, 2, 3, 4] as _}
					<div class="h-6 animate-pulse rounded bg-gray-100"></div>
				{/each}
			</div>
		{:else if stats}
			<ul class="space-y-3">
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Total Registered Users</span>
					<span class="font-medium text-gray-800">{stats.totalUsers}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Active Students</span>
					<span class="font-medium text-gray-800">{stats.activeStudents}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Active Sponsors</span>
					<span class="font-medium text-gray-800">{stats.activeSponsors}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Total Scholarships Posted</span>
					<span class="font-medium text-gray-800">{stats.totalScholarships}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Active Scholarships</span>
					<span class="font-medium text-gray-800">{stats.activeScholarships}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Closed Scholarships</span>
					<span class="font-medium text-gray-800">{stats.closedScholarships}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Total Applications Submitted</span>
					<span class="font-medium text-gray-800">{stats.totalApplications}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Approved Applications</span>
					<span class="font-medium text-green-600">{stats.approvedApplications}</span>
				</li>
				<li class="flex items-center justify-between text-sm">
					<span class="text-gray-500">Denied Applications</span>
					<span class="font-medium text-red-500">{stats.deniedApplications}</span>
				</li>
			</ul>
		{/if}
	</div>

	<!-- Action Shortcuts -->
	<div class="w-56 shrink-0 rounded-xl bg-white p-5 shadow-sm">
		<h2 class="mb-4 text-sm text-gray-700">Action Shortcuts</h2>
		<div class="grid grid-cols-2 gap-3">
			{#each actionShortcuts as shortcut (shortcut.href)}
				<a
					href={shortcut.href}
					class="flex flex-col items-center gap-2 rounded-lg border border-gray-100 p-3 text-center transition-all hover:border-[#3A52A6] hover:bg-[#EEF2FF] hover:shadow-sm"
				>
					<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500">
						{#if shortcut.icon === 'users'}
							<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						{:else if shortcut.icon === 'scholarship'}
							<svg class="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
							</svg>
						{:else if shortcut.icon === 'reports'}
							<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						{:else}
							<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						{/if}
					</div>
					<span class="text-[10px] leading-tight text-gray-600">{shortcut.label}</span>
				</a>
			{/each}
		</div>
	</div>
</div>
