<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { API_URL } from '$lib/config';
	import { getToken } from '$lib/auth';

	type Role = 'Student' | 'Sponsor' | 'Admin' | 'Unknown';
	type Status = 'Active' | 'Suspended' | 'Deactivated';

	interface User {
		user_id: string;
		initials: string;
		name: string;
		email: string;
		role: Role;
		status: Status;
		profile_url: string | null;
		registration_date: string;
	}

	let users = $state<User[]>([]);
	let loading = $state(true);
	let error = $state('');

	let searchQuery = $state('');
	let roleFilter = $state('All Roles');
	let statusFilter = $state('All Status');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalUsers = $state(0);
	const pageSize = 10;

	const roles = ['All Roles', 'Student', 'Sponsor', 'Admin'];
	const statuses = ['All Status', 'Active', 'Suspended', 'Deactivated'];

	let searchTimeout: ReturnType<typeof setTimeout>;

	async function fetchUsers() {
		loading = true;
		error = '';

		try {
			const token = getToken();
			const params = new SvelteURLSearchParams();
			params.set('page', String(currentPage));
			params.set('limit', String(pageSize));

			if (searchQuery.trim()) params.set('search', searchQuery.trim());
			if (roleFilter !== 'All Roles') params.set('role', roleFilter.toLowerCase());

			const res = await fetch(`${API_URL}/admin/users?${params}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			const data = await res.json();

			if (!data.success) {
				error = data.message;
				return;
			}

			users = data.users.map((u: User) => ({
				...u,
				registration_date: formatDate(u.registration_date)
			}));
			totalPages = data.pagination.totalPages;
			totalUsers = data.pagination.total;
		} catch {
			error = 'Failed to connect to server';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Client-side status filter (until status field is added to backend)
	let filteredUsers = $derived(
		statusFilter === 'All Status'
			? users
			: users.filter((u) => u.status === statusFilter)
	);

	// Debounced search
	function onSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1;
			fetchUsers();
		}, 300);
	}

	function onRoleChange() {
		currentPage = 1;
		fetchUsers();
	}

	function goToPage(page: number) {
		currentPage = page;
		fetchUsers();
	}

	onMount(() => {
		fetchUsers();
	});

	const avatarColors = [
		'bg-orange-400',
		'bg-indigo-700',
		'bg-green-500',
		'bg-red-500',
		'bg-teal-500',
		'bg-gray-800',
		'bg-blue-500',
		'bg-purple-500',
		'bg-pink-500',
		'bg-cyan-500'
	];

	function getAvatarBg(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return avatarColors[Math.abs(hash) % avatarColors.length];
	}

	const roleBadge: Record<Role, string> = {
		Student: 'bg-blue-50 text-blue-600',
		Sponsor: 'bg-amber-50 text-amber-600',
		Admin: 'bg-red-50 text-red-500',
		Unknown: 'bg-gray-50 text-gray-500'
	};

	const statusBadge: Record<Status, { dot: string; text: string }> = {
		Active: { dot: 'bg-green-500', text: 'text-green-600' },
		Suspended: { dot: 'bg-amber-400', text: 'text-amber-500' },
		Deactivated: { dot: 'bg-red-500', text: 'text-red-500' }
	};

	function getVisiblePages(): (number | '...')[] {
		if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
		if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
		if (currentPage >= totalPages - 2)
			return [1, '...', totalPages - 2, totalPages - 1, totalPages];
		return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
	}
</script>

<svelte:head>
	<title>iSkolar — User Management</title>
</svelte:head>

<!-- Page Title -->
<div class="mb-5">
	<h1 class="text-xl text-gray-800">User Management</h1>
	<p class="mt-0.5 text-xs text-gray-400">
		{totalUsers} registered user{totalUsers !== 1 ? 's' : ''} — Students, Sponsors & Admins
	</p>
</div>

<!-- Content Card -->
<div class="rounded-xl bg-white p-6 shadow-sm">
	<!-- Filters -->
	<div class="mb-5 flex items-center gap-3">
		<!-- Search -->
		<div class="relative flex-1">
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<input
				type="text"
				placeholder="Search by name, email or role..."
				bind:value={searchQuery}
				oninput={onSearchInput}
				class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-xs text-gray-600 placeholder:text-gray-400 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			/>
		</div>

		<!-- Role Filter -->
		<div class="relative">
			<select
				bind:value={roleFilter}
				onchange={onRoleChange}
				class="appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			>
				{#each roles as role (role)}
					<option value={role}>{role}</option>
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

		<!-- Status Filter -->
		<div class="relative">
			<select
				bind:value={statusFilter}
				class="appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			>
				{#each statuses as status (status)}
					<option value={status}>{status}</option>
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

		<!-- Time Filter -->
		<div class="relative">
			<select
				class="appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			>
				<option>All Time</option>
				<option>This Week</option>
				<option>This Month</option>
				<option>This Year</option>
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
			<span class="ml-3 text-sm text-gray-400">Loading users...</span>
		</div>
	{:else if error}
		<div class="py-12 text-center text-sm text-red-500">{error}</div>
	{:else}
		<!-- Table -->
		<table class="w-full">
			<thead>
				<tr class="border-b border-gray-100">
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">User</th>
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Role</th>
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Status</th>
					<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
						>Registration Date</th
					>
					<th class="pb-3 text-right text-[10px] uppercase tracking-wider text-gray-400"
						>Actions</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50">
				{#each filteredUsers as user (user.user_id)}
					<tr class="group transition-colors hover:bg-gray-50">
						<!-- User -->
						<td class="py-3.5 pr-4">
							<div class="flex items-center gap-3">
								{#if user.profile_url}
									<img
										src={user.profile_url}
										alt={user.name}
										class="h-9 w-9 shrink-0 rounded-full object-cover"
									/>
								{:else}
									<div
										class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs text-white {getAvatarBg(user.name)}"
									>
										{user.initials}
									</div>
								{/if}
								<div>
									<p class="text-sm text-gray-700">{user.name}</p>
									<p class="text-xs text-gray-400">{user.email}</p>
								</div>
							</div>
						</td>

						<!-- Role -->
						<td class="py-3.5 pr-4">
							<span
								class="rounded-md px-2.5 py-1 text-xs font-medium {roleBadge[user.role]}"
							>
								{user.role}
							</span>
						</td>

						<!-- Status -->
						<td class="py-3.5 pr-4">
							<span
								class="flex items-center gap-1.5 text-xs font-medium {statusBadge[user.status].text}"
							>
								<span
									class="inline-block h-1.5 w-1.5 rounded-full {statusBadge[user.status].dot}"
								></span>
								{user.status}
							</span>
						</td>

						<!-- Registration Date -->
						<td class="py-3.5 pr-4 text-xs text-gray-500">
							{user.registration_date}
						</td>

						<!-- Actions -->
						<td class="py-3.5">
							<div class="flex items-center justify-end gap-2">
								<a
									href={resolve('/user-management') + `/${user.user_id}`}
									title="View"
									class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6]"
								>
									<svg
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</a>
								<button
									title="Manage"
									class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6]"
								>
									<svg
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</button>
							</div>
						</td>
					</tr>
				{/each}

				{#if filteredUsers.length === 0}
					<tr>
						<td colspan="5" class="py-12 text-center text-sm text-gray-400">
							No users match the current filters.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-5 flex items-center justify-end gap-1">
				<button
					onclick={() => {
						if (currentPage > 1) goToPage(currentPage - 1);
					}}
					disabled={currentPage === 1}
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6] disabled:cursor-not-allowed disabled:opacity-40"
				>
					&lt;
				</button>

				{#each getVisiblePages() as p (p)}
					{#if p === '...'}
						<span class="flex h-7 w-7 items-center justify-center text-xs text-gray-400"
							>…</span
						>
					{:else}
						<button
							onclick={() => {
								goToPage(p as number);
							}}
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
					onclick={() => {
						if (currentPage < totalPages) goToPage(currentPage + 1);
					}}
					disabled={currentPage === totalPages}
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6] disabled:cursor-not-allowed disabled:opacity-40"
				>
					&gt;
				</button>
			</div>
		{/if}
	{/if}
</div>
