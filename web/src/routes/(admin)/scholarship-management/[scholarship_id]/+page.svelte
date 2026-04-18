<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';
	import { getToken } from '$lib/auth';

	type ScholarshipStatus = 'active' | 'closed' | 'suspended' | 'archived' | 'draft';

	interface ScholarshipDetail {
		scholarship_id: string;
		title: string;
		description: string | null;
		sponsor_id: string;
		sponsor_name: string;
		sponsor_type: string | null;
		sponsor_contact: string | null;
		sponsor_email: string | null;
		type: string | null;
		purpose: string | null;
		total_amount: number;
		total_slot: number;
		application_deadline: string | null;
		criteria: string[];
		required_documents: string[];
		status: ScholarshipStatus;
		image_url: string | null;
		created_at: string;
		updated_at: string;
	}

	let scholarship = $state<ScholarshipDetail | null>(null);
	let loading = $state(true);
	let error = $state('');

	// Status management
	let pendingStatus = $state<ScholarshipStatus | null>(null);
	let confirmingStatus = $state(false);
	let statusLoading = $state(false);
	let statusMessage = $state('');
	let statusIsError = $state(false);

	const scholarshipId = page.params.scholarship_id;

	async function fetchScholarship() {
		loading = true;
		error = '';
		try {
			const token = getToken();
			const res = await fetch(`${API_URL}/admin/scholarships/${scholarshipId}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (!data.success) {
				error = data.message;
				return;
			}
			scholarship = data.scholarship;
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

	function formatDeadline(dateStr: string | null): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	function isDeadlinePassed(dateStr: string | null): boolean {
		if (!dateStr) return false;
		return new Date(dateStr) < new Date();
	}

	function formatAmount(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatType(type: string | null): string {
		if (!type) return '—';
		return type === 'merit_based' ? 'Merit-Based' : 'Skill-Based';
	}

	function formatPurpose(purpose: string | null): string {
		if (!purpose) return '—';
		return purpose === 'allowance' ? 'Allowance' : 'Tuition';
	}

	function formatSponsorType(type: string | null): string {
		if (!type) return '—';
		const labels: Record<string, string> = {
			non_profit: 'Non-Profit',
			private_company: 'Private Company',
			government_agency: 'Government Agency',
			educational_institution: 'Educational Institution',
			foundation: 'Foundation'
		};
		return labels[type] ?? type;
	}

	const statusStyle: Record<string, { dot: string; text: string; bg: string }> = {
		active: { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
		closed: { dot: 'bg-gray-400', text: 'text-gray-500', bg: 'bg-gray-50' },
		suspended: { dot: 'bg-amber-400', text: 'text-amber-500', bg: 'bg-amber-50' },
		archived: { dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50' },
		draft: { dot: 'bg-blue-400', text: 'text-blue-500', bg: 'bg-blue-50' }
	};

	const statusActions: { value: ScholarshipStatus; label: string; border: string; text: string; hover: string }[] = [
		{ value: 'active', label: 'Set Active', border: 'border-green-200', text: 'text-green-600', hover: 'hover:bg-green-50' },
		{ value: 'closed', label: 'Close Scholarship', border: 'border-gray-200', text: 'text-gray-500', hover: 'hover:bg-gray-50' },
		{ value: 'suspended', label: 'Suspend Scholarship', border: 'border-amber-200', text: 'text-amber-600', hover: 'hover:bg-amber-50' },
		{ value: 'archived', label: 'Archive Scholarship', border: 'border-red-200', text: 'text-red-500', hover: 'hover:bg-red-50' }
	];

	const statusInfo: Record<string, string> = {
		active: 'Open for student applications.',
		closed: 'New applications are disabled. Apply button is hidden for students.',
		suspended: 'Temporarily disabled. Apply button is hidden for students.',
		archived: 'Permanently closed. No further changes expected.'
	};

	function initiateStatusChange(s: ScholarshipStatus) {
		pendingStatus = s;
		confirmingStatus = true;
		statusMessage = '';
	}

	function cancelStatusChange() {
		confirmingStatus = false;
		pendingStatus = null;
	}

	async function confirmStatusChange() {
		if (!pendingStatus || !scholarship) return;
		statusLoading = true;
		statusIsError = false;
		try {
			const token = getToken();
			const res = await fetch(`${API_URL}/admin/scholarships/${scholarshipId}/status`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: pendingStatus })
			});
			const data = await res.json();
			if (!data.success) {
				statusIsError = true;
				statusMessage = data.message || 'Failed to update status.';
				return;
			}
			scholarship = { ...scholarship, status: pendingStatus };
			statusMessage = `Status updated to ${pendingStatus.charAt(0).toUpperCase() + pendingStatus.slice(1)}.`;
		} catch {
			statusIsError = true;
			statusMessage = 'Failed to connect to server.';
		} finally {
			statusLoading = false;
			confirmingStatus = false;
			pendingStatus = null;
			setTimeout(() => (statusMessage = ''), 3500);
		}
	}

	onMount(() => {
		fetchScholarship();
	});
</script>

<svelte:head>
	<title>iSkolar — Scholarship Detail</title>
</svelte:head>

<!-- Back Navigation -->
<div class="mb-5 flex items-center gap-3">
	<a
		href={resolve('/scholarship-management')}
		onclick={(e) => {
			e.preventDefault();
			goto(resolve('/scholarship-management'));
		}}
		class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6]"
		title="Back to Scholarship List"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
	</a>
	<div>
		<h1 class="text-xl text-gray-800">Scholarship Detail</h1>
		<p class="mt-0.5 text-xs text-gray-400">View and manage scholarship status</p>
	</div>
</div>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#3A52A6]"></div>
		<span class="ml-3 text-sm text-gray-400">Loading scholarship...</span>
	</div>
{:else if error}
	<div class="rounded-xl bg-white p-10 text-center shadow-sm">
		<p class="text-sm text-red-500">{error}</p>
		<button
			onclick={fetchScholarship}
			class="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:border-[#3A52A6] hover:text-[#3A52A6]"
		>
			Retry
		</button>
	</div>
{:else if scholarship}
	<div class="grid grid-cols-3 gap-5">
		<!-- Left Column -->
		<div class="col-span-1 flex flex-col gap-5">
			<!-- Scholarship Card -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<!-- Image or placeholder -->
				{#if scholarship.image_url}
					<img
						src={scholarship.image_url}
						alt={scholarship.title}
						class="mb-4 h-32 w-full rounded-lg object-cover"
					/>
				{:else}
					<div class="mb-4 flex h-32 w-full items-center justify-center rounded-lg bg-[#EEF2FF]">
						<svg class="h-10 w-10 text-[#3A52A6]" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
						</svg>
					</div>
				{/if}

				<h2 class="text-base text-gray-800">{scholarship.title}</h2>
				<p class="mt-1 text-xs text-gray-400">{scholarship.sponsor_name}</p>

				<!-- Status badge -->
				<div class="mt-3">
					<span
						class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium
						{statusStyle[scholarship.status]?.bg ?? 'bg-gray-50'}
						{statusStyle[scholarship.status]?.text ?? 'text-gray-500'}"
					>
						<span class="inline-block h-1.5 w-1.5 rounded-full {statusStyle[scholarship.status]?.dot ?? 'bg-gray-400'}"></span>
						{scholarship.status.charAt(0).toUpperCase() + scholarship.status.slice(1)}
					</span>
				</div>

				<p class="mt-3 text-[10px] uppercase tracking-wider text-gray-400">
					Created {formatDate(scholarship.created_at)}
				</p>
			</div>

			<!-- Status Management -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<h3 class="mb-1 text-xs uppercase tracking-wider text-gray-400">Status Control</h3>
				<p class="mb-4 text-[10px] text-gray-400">
					{statusInfo[scholarship.status] ?? ''}
				</p>

				{#if statusMessage}
					<p
						class="mb-3 rounded-lg px-3 py-2 text-xs {statusIsError
							? 'bg-red-50 text-red-500'
							: 'bg-green-50 text-green-600'}"
					>
						{statusMessage}
					</p>
				{/if}

				{#if confirmingStatus}
					<div class="rounded-lg border border-amber-100 bg-amber-50 p-3">
						<p class="text-xs text-amber-700">
							Set this scholarship to
							<span class="font-medium capitalize">{pendingStatus}</span>?
						</p>
						{#if pendingStatus === 'closed' || pendingStatus === 'suspended'}
							<p class="mt-1 text-[10px] text-amber-600">
								New applications will be disabled and the Apply button will be hidden for students.
							</p>
						{/if}
						<div class="mt-3 flex gap-2">
							<button
								onclick={confirmStatusChange}
								disabled={statusLoading}
								class="flex-1 cursor-pointer rounded-lg bg-[#3A52A6] py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-60"
							>
								{statusLoading ? 'Saving...' : 'Confirm'}
							</button>
							<button
								onclick={cancelStatusChange}
								class="flex-1 cursor-pointer rounded-lg border border-gray-200 py-1.5 text-xs text-gray-500 hover:border-gray-300"
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each statusActions as action (action.value)}
							{#if scholarship.status !== action.value}
								<button
									onclick={() => initiateStatusChange(action.value)}
									class="w-full cursor-pointer rounded-lg border py-2 text-xs transition-all
									{action.border} {action.text} {action.hover}"
								>
									{action.label}
								</button>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column -->
		<div class="col-span-2 flex flex-col gap-5">
			<!-- Scholarship Details -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-xs uppercase tracking-wider text-gray-400">Scholarship Information</h3>
				<div class="grid grid-cols-2 gap-x-8 gap-y-4">
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Title</p>
						<p class="mt-1 text-sm text-gray-700">{scholarship.title}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Type</p>
						<p class="mt-1 text-sm text-gray-700">{formatType(scholarship.type)}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Purpose</p>
						<p class="mt-1 text-sm text-gray-700">{formatPurpose(scholarship.purpose)}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Amount</p>
						<p class="mt-1 text-sm text-gray-700">{formatAmount(scholarship.total_amount)}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Slots Available</p>
						<p class="mt-1 text-sm text-gray-700">{scholarship.total_slot}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Application Deadline</p>
						<p class="mt-1 text-sm {isDeadlinePassed(scholarship.application_deadline) ? 'text-red-500' : 'text-gray-700'}">
							{formatDeadline(scholarship.application_deadline)}
							{#if isDeadlinePassed(scholarship.application_deadline)}
								<span class="ml-1 text-[10px]">(Passed)</span>
							{/if}
						</p>
					</div>
					<div class="col-span-2">
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Description</p>
						<p class="mt-1 text-sm text-gray-700">{scholarship.description ?? '—'}</p>
					</div>
				</div>
			</div>

			<!-- Sponsor Information -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-xs uppercase tracking-wider text-gray-400">Sponsor Information</h3>
				<div class="grid grid-cols-2 gap-x-8 gap-y-4">
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Organization</p>
						<p class="mt-1 text-sm text-gray-700">{scholarship.sponsor_name}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Organization Type</p>
						<p class="mt-1 text-sm text-gray-700">{formatSponsorType(scholarship.sponsor_type)}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Contact Number</p>
						<p class="mt-1 text-sm text-gray-700">{scholarship.sponsor_contact ?? '—'}</p>
					</div>
					<div>
						<p class="text-[10px] uppercase tracking-wider text-gray-400">Email</p>
						<p class="mt-1 text-sm text-gray-700">{scholarship.sponsor_email ?? '—'}</p>
					</div>
				</div>
			</div>

			<!-- Criteria & Requirements -->
			<div class="rounded-xl bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-xs uppercase tracking-wider text-gray-400">Criteria & Requirements</h3>
				<div class="grid grid-cols-2 gap-x-8 gap-y-4">
					<div>
						<p class="mb-2 text-[10px] uppercase tracking-wider text-gray-400">Eligibility Criteria</p>
						{#if scholarship.criteria.length > 0}
							<ul class="space-y-1">
								{#each scholarship.criteria as c, i (i)}
									<li class="flex items-start gap-2 text-xs text-gray-600">
										<span class="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#3A52A6]"></span>
										{c}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-xs text-gray-400">—</p>
						{/if}
					</div>
					<div>
						<p class="mb-2 text-[10px] uppercase tracking-wider text-gray-400">Required Documents</p>
						{#if scholarship.required_documents.length > 0}
							<ul class="space-y-1">
								{#each scholarship.required_documents as d, i (i)}
									<li class="flex items-start gap-2 text-xs text-gray-600">
										<span class="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#3A52A6]"></span>
										{d}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-xs text-gray-400">—</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
