<script lang="ts">
	type Role = 'Student' | 'Sponsor' | 'Admin';
	type Status = 'Active' | 'Suspended' | 'Deactivated';

	interface User {
		initials: string;
		avatarBg: string;
		name: string;
		email: string;
		role: Role;
		status: Status;
		registrationDate: string;
	}

	const allUsers: User[] = [
		{
			initials: 'LC',
			avatarBg: 'bg-orange-400',
			name: 'Louigie Caday',
			email: 'louigiecaday@email.com',
			role: 'Student',
			status: 'Active',
			registrationDate: 'Aug 15, 2025'
		},
		{
			initials: 'KC',
			avatarBg: 'bg-indigo-700',
			name: 'Korbin Canlas',
			email: 'korbincanlas@email.com',
			role: 'Student',
			status: 'Active',
			registrationDate: 'Jul 3, 2025'
		},
		{
			initials: 'JL',
			avatarBg: 'bg-green-500',
			name: 'John Lou Manuel',
			email: 'johnloumanuel@email.com',
			role: 'Student',
			status: 'Suspended',
			registrationDate: 'Jan 10, 2025'
		},
		{
			initials: 'MS',
			avatarBg: 'bg-red-500',
			name: 'Meinard Santos',
			email: 'meinardSantos@email.com',
			role: 'Student',
			status: 'Deactivated',
			registrationDate: 'Mar 22, 2025'
		},
		{
			initials: 'TL',
			avatarBg: 'bg-teal-500',
			name: 'Taguig LANI Scholarship',
			email: 'scholarship.secretariat@taguig.gov.ph',
			role: 'Sponsor',
			status: 'Active',
			registrationDate: 'Feb 5, 2025'
		},
		{
			initials: 'AU',
			avatarBg: 'bg-gray-800',
			name: 'Admin User',
			email: 'admin@iskolar.ph',
			role: 'Admin',
			status: 'Active',
			registrationDate: 'Jan 1, 2025'
		}
	];

	let searchQuery = $state('');
	let roleFilter = $state('All Roles');
	let statusFilter = $state('All Status');
	let currentPage = $state(1);
	const totalPages = 24;

	const roles = ['All Roles', 'Student', 'Sponsor', 'Admin'];
	const statuses = ['All Status', 'Active', 'Suspended', 'Deactivated'];

	let filteredUsers = $derived(
		allUsers.filter((u) => {
			const matchesSearch =
				!searchQuery ||
				u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.role.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
			const matchesStatus = statusFilter === 'All Status' || u.status === statusFilter;
			return matchesSearch && matchesRole && matchesStatus;
		})
	);

	const roleBadge: Record<Role, string> = {
		Student: 'bg-blue-50 text-blue-600',
		Sponsor: 'bg-amber-50 text-amber-600',
		Admin: 'bg-red-50 text-red-500'
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
	<h1 class="text-xl font-bold text-gray-800">User Management</h1>
	<p class="mt-0.5 text-xs text-gray-400">248 registered users — Students, Sponsors & Admins</p>
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
				class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-xs text-gray-600 placeholder:text-gray-400 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			/>
		</div>

		<!-- Role Filter -->
		<div class="relative">
			<select
				bind:value={roleFilter}
				class="appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			>
				{#each roles as role}
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
				{#each statuses as status}
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

	<!-- Table -->
	<table class="w-full">
		<thead>
			<tr class="border-b border-gray-100">
				<th class="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400"
					>User</th
				>
				<th class="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400"
					>Role</th
				>
				<th class="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400"
					>Status</th
				>
				<th class="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400"
					>Registration Date</th
				>
				<th class="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400"
					>Actions</th
				>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-50">
			{#each filteredUsers as user}
				<tr class="group transition-colors hover:bg-gray-50">
					<!-- User -->
					<td class="py-3.5 pr-4">
						<div class="flex items-center gap-3">
							<div
								class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white {user.avatarBg}"
							>
								{user.initials}
							</div>
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
						<span class="flex items-center gap-1.5 text-xs font-medium {statusBadge[user.status].text}">
							<span
								class="inline-block h-1.5 w-1.5 rounded-full {statusBadge[user.status].dot}"
							></span>
							{user.status}
						</span>
					</td>

					<!-- Registration Date -->
					<td class="py-3.5 pr-4 text-xs text-gray-500">
						{user.registrationDate}
					</td>

					<!-- Actions -->
					<td class="py-3.5">
						<div class="flex items-center justify-end gap-2">
							<button
								title="View"
								class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6]"
							>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
									/>
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</button>
							<button
								title="Manage"
								class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6]"
							>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
									/>
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
	<div class="mt-5 flex items-center justify-end gap-1">
		<button
			onclick={() => { if (currentPage > 1) currentPage--; }}
			disabled={currentPage === 1}
			class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6] disabled:cursor-not-allowed disabled:opacity-40"
		>
			&lt;
		</button>

		{#each getVisiblePages() as p}
			{#if p === '...'}
				<span class="flex h-7 w-7 items-center justify-center text-xs text-gray-400">…</span>
			{:else}
				<button
					onclick={() => { currentPage = p as number; }}
					class="flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-all
						{currentPage === p
							? 'border-[#3A52A6] bg-[#3A52A6] font-semibold text-white'
							: 'border-gray-200 text-gray-500 hover:border-[#3A52A6] hover:text-[#3A52A6]'}"
				>
					{p}
				</button>
			{/if}
		{/each}

		<button
			onclick={() => { if (currentPage < totalPages) currentPage++; }}
			disabled={currentPage === totalPages}
			class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6] disabled:cursor-not-allowed disabled:opacity-40"
		>
			&gt;
		</button>
	</div>
</div>
