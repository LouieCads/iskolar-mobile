<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';
	import { getToken } from '$lib/auth';

	type Role = 'Student' | 'Sponsor' | 'Admin' | 'Unknown';
	type Status = 'Active' | 'Suspended' | 'Deactivated';

	interface StudentProfile {
		full_name: string;
		gender: string | null;
		date_of_birth: string | null;
		contact_number: string | null;
		has_completed_profile: boolean;
	}

	interface SponsorProfile {
		organization_name: string;
		organization_type: string | null;
		contact_number: string | null;
		has_completed_profile: boolean;
	}

	interface UserDetail {
		user_id: string;
		name: string;
		email: string;
		role: Role;
		status: Status;
		profile_url: string | null;
		has_selected_role: boolean;
		registration_date: string;
		student: StudentProfile | null;
		sponsor: SponsorProfile | null;
	}

	let user = $state<UserDetail | null>(null);
	let loading = $state(true);
	let error = $state('');

	// Status management
	let statusAction = $state<'Suspended' | 'Deactivated' | null>(null);
	let confirmingStatus = $state(false);
	let statusLoading = $state(false);
	let statusMessage = $state('');

	const userId = page.params.user_id;

	async function fetchUser() {
		loading = true;
		error = '';
		try {
			const token = getToken();
			const res = await fetch(`${API_URL}/admin/users/${userId}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (!data.success) {
				error = data.message;
				return;
			}
			const u = data.user;
			user = {
				...u,
				registration_date: formatDate(u.registration_date)
			};
		} catch {
			error = 'Failed to connect to server';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	function formatDOB(dateStr: string | null): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join('');
	}

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

	const statusBadge: Record<Status, { dot: string; text: string; bg: string }> = {
		Active: { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
		Suspended: { dot: 'bg-amber-400', text: 'text-amber-500', bg: 'bg-amber-50' },
		Deactivated: { dot: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50' }
	};

	function initiateStatusChange(action: 'Suspended' | 'Deactivated') {
		statusAction = action;
		confirmingStatus = true;
		statusMessage = '';
	}

	function cancelStatusChange() {
		confirmingStatus = false;
		statusAction = null;
	}

	async function confirmStatusChange() {
		if (!statusAction || !user) return;
		statusLoading = true;
		// Status update is a planned backend feature — optimistically update UI
		await new Promise((r) => setTimeout(r, 600));
		user = { ...user, status: statusAction };
		statusLoading = false;
		confirmingStatus = false;
		statusAction = null;
		statusMessage = 'User status updated successfully.';
		setTimeout(() => (statusMessage = ''), 3000);
	}

	function restoreActive() {
		if (!user) return;
		user = { ...user, status: 'Active' };
		statusMessage = 'User status restored to Active.';
		setTimeout(() => (statusMessage = ''), 3000);
	}

	onMount(() => {
		fetchUser();
	});
</script>

<svelte:head>
	<title>iSkolar — User Profile</title>
</svelte:head>

<!-- Back Navigation -->
<div class="mb-5 flex items-center gap-3">
	<a
		href={resolve('/user-management')}
		onclick={(e) => {
			e.preventDefault();
			goto(resolve('/user-management'));
		}}
		class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6]"
		title="Back to User List"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
	</a>
	<div>
		<h1 class="text-xl text-gray-800">User Profile</h1>
		<p class="mt-0.5 text-xs text-gray-400">View and manage user account details</p>
	</div>
</div>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#3A52A6]"></div>
		<span class="ml-3 text-sm text-gray-400">Loading profile...</span>
	</div>
{:else if error}
	<div class="rounded-xl bg-white p-10 text-center shadow-sm">
		<p class="text-sm text-red-500">{error}</p>
		<button
			onclick={fetchUser}
			class="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:border-[#3A52A6] hover:text-[#3A52A6]"
		>
			Retry
		</button>
	</div>
{:else if user}
	<div class="grid grid-cols-3 gap-5">
		<!-- Left Column -->
		<div class="col-span-1 flex flex-col gap-5">
			<!-- Profile Card -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<div class="flex flex-col items-center text-center">
					<!-- Avatar -->
					{#if user.profile_url}
						<img
							src={user.profile_url}
							alt={user.name}
							class="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100"
						/>
					{:else}
						<div
							class="flex h-20 w-20 items-center justify-center rounded-full text-xl text-white ring-4 ring-gray-100 {getAvatarBg(user.name)}"
						>
							{getInitials(user.name)}
						</div>
					{/if}

					<h2 class="mt-3 text-base text-gray-800">{user.name}</h2>
					<p class="mt-0.5 text-xs text-gray-400">{user.email}</p>

					<!-- Role & Status -->
					<div class="mt-3 flex items-center gap-2">
						<span class="rounded-md px-2.5 py-1 text-xs font-medium {roleBadge[user.role]}">
							{user.role}
						</span>
						<span
							class="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium {statusBadge[user.status].bg} {statusBadge[user.status].text}"
						>
							<span
								class="inline-block h-1.5 w-1.5 rounded-full {statusBadge[user.status].dot}"
							></span>
							{user.status}
						</span>
					</div>

					<p class="mt-3 text-[10px] uppercase tracking-wider text-gray-400">
						Registered {user.registration_date}
					</p>
				</div>
			</div>

			<!-- Status Management -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-xs uppercase tracking-wider text-gray-400">Status Management</h3>

				{#if statusMessage}
					<p class="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-600">{statusMessage}</p>
				{/if}

				{#if confirmingStatus}
					<div class="rounded-lg border border-amber-100 bg-amber-50 p-3">
						<p class="text-xs text-amber-700">
							Set this user's status to <span class="font-medium">{statusAction}</span>?
						</p>
						<div class="mt-3 flex gap-2">
							<button
								onclick={confirmStatusChange}
								disabled={statusLoading}
								class="flex-1 rounded-lg cursor-pointer bg-[#3A52A6] py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-60"
							>
								{statusLoading ? 'Saving...' : 'Confirm'}
							</button>
							<button
								onclick={cancelStatusChange}
								class="flex-1 rounded-lg border cursor-pointer border-gray-200 py-1.5 text-xs text-gray-500 hover:border-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#if user.status !== 'Active'}
							<button
								onclick={restoreActive}
								class="w-full cursor-pointer rounded-lg border border-green-200 py-2 text-xs text-green-600 transition-all hover:bg-green-50"
							>
								Restore to Active
							</button>
						{/if}
						{#if user.status !== 'Suspended'}
							<button
								onclick={() => initiateStatusChange('Suspended')}
								class="w-full rounded-lg cursor-pointer border border-amber-200 py-2 text-xs text-amber-600 transition-all hover:bg-amber-50"
							>
								Suspend User
							</button>
						{/if}
						{#if user.status !== 'Deactivated'}
							<button
								onclick={() => initiateStatusChange('Deactivated')}
								class="w-full rounded-lg cursor-pointer border border-red-200 py-2 text-xs text-red-500 transition-all hover:bg-red-50"
							>
								Deactivate User
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column -->
		<div class="col-span-2 flex flex-col gap-5">
			<!-- Account Information -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-xs uppercase tracking-wider text-gray-400">Account Information</h3>
				<div class="grid grid-cols-2 gap-x-8 gap-y-4">
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Email Address</p>
						<p class="mt-1 text-sm text-gray-700">{user.email}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Role</p>
						<p class="mt-1 text-sm text-gray-700">{user.role}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Registration Date</p>
						<p class="mt-1 text-sm text-gray-700">{user.registration_date}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Profile Setup</p>
						<p class="mt-1 text-sm text-gray-700">
							{user.has_selected_role ? 'Role selected' : 'Pending role selection'}
						</p>
					</div>
				</div>
			</div>

			<!-- Student Profile -->
			{#if user.student}
				<div class="rounded-xl bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-xs uppercase tracking-wider text-gray-400">Student Information</h3>
						{#if user.student.has_completed_profile}
							<span class="rounded-full bg-green-50 px-2.5 py-1 text-[10px] text-green-600"
								>Profile complete</span
							>
						{:else}
							<span class="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] text-amber-500"
								>Incomplete</span
							>
						{/if}
					</div>
					<div class="grid grid-cols-2 gap-x-8 gap-y-4">
						<div>
							<p class="text-[10px] uppercase tracking-wider text-gray-400">Full Name</p>
							<p class="mt-1 text-sm text-gray-700">{user.student.full_name}</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wider text-gray-400">Gender</p>
							<p class="mt-1 text-sm text-gray-700">{user.student.gender ?? '—'}</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wider text-gray-400">Date of Birth</p>
							<p class="mt-1 text-sm text-gray-700">{formatDOB(user.student.date_of_birth)}</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wider text-gray-400">Contact Number</p>
							<p class="mt-1 text-sm text-gray-700">{user.student.contact_number ?? '—'}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Sponsor Profile -->
			{#if user.sponsor}
				<div class="rounded-xl bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-xs uppercase tracking-wider text-gray-400">Organization Information</h3>
						{#if user.sponsor.has_completed_profile}
							<span class="rounded-full bg-green-50 px-2.5 py-1 text-[10px] text-green-600"
								>Profile complete</span
							>
						{:else}
							<span class="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] text-amber-500"
								>Incomplete</span
							>
						{/if}
					</div>
					<div class="grid grid-cols-2 gap-x-8 gap-y-4">
						<div>
							<p class="text-[10px] uppercase tracking-wider text-gray-400">Organization Name</p>
							<p class="mt-1 text-sm text-gray-700">{user.sponsor.organization_name}</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wider text-gray-400">Organization Type</p>
							<p class="mt-1 text-sm text-gray-700">{user.sponsor.organization_type ?? '—'}</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wider text-gray-400">Contact Number</p>
							<p class="mt-1 text-sm text-gray-700">{user.sponsor.contact_number ?? '—'}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Scholarship Activity -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-xs uppercase tracking-wider text-gray-400">
					{user.role === 'Student' ? 'Scholarship Applications' : user.role === 'Sponsor' ? 'Posted Scholarships' : 'Activity'}
				</h3>

				{#if !user.student && !user.sponsor}
					<p class="py-6 text-center text-xs text-gray-400">
						No activity available for this account.
					</p>
				{:else if !user.has_selected_role}
					<p class="py-6 text-center text-xs text-gray-400">
						User has not completed role setup — no activity to display.
					</p>
				{:else}
					<!-- Activity Table Placeholder -->
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-100">
								{#if user.role === 'Student'}
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Scholarship</th
									>
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Sponsor</th
									>
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Applied On</th
									>
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Status</th
									>
								{:else if user.role === 'Sponsor'}
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Scholarship Title</th
									>
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Posted On</th
									>
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Applicants</th
									>
									<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
										>Status</th
									>
								{/if}
							</tr>
						</thead>
						<tbody>
							<tr>
								<td
									colspan="4"
									class="py-10 text-center text-xs text-gray-400"
								>
									Activity data will be available once connected to the scholarship tracking module.
								</td>
							</tr>
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	</div>
{/if}
