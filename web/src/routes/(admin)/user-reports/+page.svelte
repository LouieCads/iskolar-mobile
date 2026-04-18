<script lang="ts">
	import { API_URL } from '$lib/config';
	import { getToken } from '$lib/auth';

	type RoleFilter = 'All' | 'Student' | 'Sponsor' | 'Admin';
	type StatusFilter = 'All' | 'Active' | 'Suspended' | 'Deactivated';
	type ActivityFilter = 'All' | 'High' | 'Medium' | 'Low';

	interface ReportUser {
		user_id: string;
		name: string;
		email: string;
		role: string;
		status: string;
		profile_completion: string;
		activity_level: string;
		activity_count: number;
		registration_date: string;
	}

	interface Report {
		title: string;
		generated_at: string;
		filters: {
			role: string;
			status: string;
			from_date: string | null;
			to_date: string | null;
			activity_level: string;
		};
		summary: {
			total: number;
			byRole: Record<string, number>;
			byStatus: Record<string, number>;
			byActivity: Record<string, number>;
		};
		data: ReportUser[];
	}

	let roleFilter = $state<RoleFilter>('All');
	let statusFilter = $state<StatusFilter>('All');
	let activityFilter = $state<ActivityFilter>('All');
	let fromDate = $state('');
	let toDate = $state('');

	let report = $state<Report | null>(null);
	let loading = $state(false);
	let exportingPDF = $state(false);
	let error = $state('');

	const roles: RoleFilter[] = ['All', 'Student', 'Sponsor', 'Admin'];
	const statuses: StatusFilter[] = ['All', 'Active', 'Suspended', 'Deactivated'];
	const activities: ActivityFilter[] = ['All', 'High', 'Medium', 'Low'];

	async function generateReport() {
		if (fromDate && toDate && fromDate > toDate) {
			error = 'From Date cannot be after To Date';
			return;
		}

		loading = true;
		error = '';
		report = null;

		try {
			const token = getToken();
			const params = new URLSearchParams();
			if (roleFilter !== 'All') params.set('role', roleFilter.toLowerCase());
			if (statusFilter !== 'All') params.set('status', statusFilter.toLowerCase());
			if (activityFilter !== 'All') params.set('activity_level', activityFilter.toLowerCase());
			if (fromDate) params.set('from_date', fromDate);
			if (toDate) params.set('to_date', toDate);

			const res = await fetch(`${API_URL}/admin/reports/users?${params}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const data = await res.json();
			if (!data.success) {
				error = data.message;
				return;
			}
			report = data.report;
		} catch {
			error = 'Failed to connect to server';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function exportPDF() {
		if (!report) return;
		exportingPDF = true;

		try {
			const { jsPDF } = await import('jspdf');
			const { autoTable } = await import('jspdf-autotable');

			const doc = new jsPDF({ orientation: 'landscape' });

			doc.setFontSize(18);
			doc.setTextColor(58, 82, 166);
			doc.text('iSkolar - User Report', 14, 18);

			doc.setFontSize(9);
			doc.setTextColor(100, 100, 100);
			doc.text(`Generated: ${formatDate(report.generated_at)}`, 14, 26);

			const filterParts = [
				`Role: ${report.filters.role}`,
				`Status: ${report.filters.status}`,
				`Activity: ${report.filters.activity_level}`,
				...(report.filters.from_date ? [`From: ${report.filters.from_date}`] : []),
				...(report.filters.to_date ? [`To: ${report.filters.to_date}`] : [])
			];
			const filterLine = `Filters: ${filterParts.join('  |  ')}`;
			const pageWidth = doc.internal.pageSize.getWidth();
			const wrappedFilter = doc.splitTextToSize(filterLine, pageWidth - 28);
			doc.text(wrappedFilter, 14, 32);

			const filterBlockHeight = wrappedFilter.length * 5;
			const summaryY = 32 + filterBlockHeight + 8;
			doc.setFontSize(10);
			doc.setTextColor(40, 40, 40);
			doc.text(`Total Users: ${report.summary.total}`, 14, summaryY);

			autoTable(doc, {
				startY: summaryY + 8,
				head: [['#', 'Name', 'Email', 'Role', 'Status', 'Profile', 'Activity', 'Registered']],
				body: report.data.map((u, i) => [
					i + 1,
					u.name,
					u.email,
					u.role,
					u.status,
					u.profile_completion,
					u.activity_level,
					formatDate(u.registration_date)
				]),
				styles: { fontSize: 8 },
				headStyles: { fillColor: [58, 82, 166] },
				alternateRowStyles: { fillColor: [240, 244, 248] }
			});

			const dateStr = new Date().toISOString().slice(0, 10);
			doc.save(`iSkolar-User-Report-${dateStr}.pdf`);
		} finally {
			exportingPDF = false;
		}
	}

	const statusBadge: Record<string, { dot: string; text: string }> = {
		Active: { dot: 'bg-green-500', text: 'text-green-600' },
		Suspended: { dot: 'bg-amber-400', text: 'text-amber-500' },
		Deactivated: { dot: 'bg-red-500', text: 'text-red-500' }
	};

	const roleBadge: Record<string, string> = {
		Student: 'bg-blue-50 text-blue-600',
		Sponsor: 'bg-amber-50 text-amber-600',
		Admin: 'bg-red-50 text-red-500'
	};

	const activityColor: Record<string, string> = {
		High: 'text-green-600',
		Medium: 'text-amber-500',
		Low: 'text-gray-400'
	};
</script>

<svelte:head>
	<title>iSkolar — User Reports</title>
</svelte:head>

<div class="mb-5">
	<h1 class="text-xl text-gray-800">User Reports</h1>
	<p class="mt-0.5 text-xs text-gray-400">
		Generate and export user account reports based on role, status, and activity
	</p>
</div>

<!-- Filter Panel -->
<div class="mb-5 rounded-xl bg-white p-5 shadow-sm">
	<p class="mb-4 text-[10px] font-medium uppercase tracking-wider text-gray-400">
		Report Filters
	</p>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
		<!-- Role -->
		<div>
			<label for="filter-role" class="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">Role</label>
			<div class="relative">
				<select
					id="filter-role"
					bind:value={roleFilter}
					class="w-full appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-7 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
				>
					{#each roles as r (r)}
						<option value={r}>{r === 'All' ? 'All Roles' : r}</option>
					{/each}
				</select>
				<svg
					class="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>

		<!-- Status -->
		<div>
			<label for="filter-status" class="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">Status</label>
			<div class="relative">
				<select
					id="filter-status"
					bind:value={statusFilter}
					class="w-full appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-7 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
				>
					{#each statuses as s (s)}
						<option value={s}>{s === 'All' ? 'All Statuses' : s}</option>
					{/each}
				</select>
				<svg
					class="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>

		<!-- Activity Level -->
		<div>
			<label for="filter-activity" class="mb-1 block text-[10px] uppercase tracking-wide text-gray-400"
				>Activity Level</label
			>
			<div class="relative">
				<select
					id="filter-activity"
					bind:value={activityFilter}
					class="w-full appearance-none rounded-lg border border-gray-200 py-2 pl-3 pr-7 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
				>
					{#each activities as a (a)}
						<option value={a}>{a === 'All' ? 'All Activity' : a + ' Activity'}</option>
					{/each}
				</select>
				<svg
					class="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>

		<!-- From Date -->
		<div>
			<label for="filter-from" class="mb-1 block text-[10px] uppercase tracking-wide text-gray-400"
				>From Date</label
			>
			<input
				id="filter-from"
				type="date"
				bind:value={fromDate}
				class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			/>
		</div>

		<!-- To Date -->
		<div>
			<label for="filter-to" class="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">To Date</label>
			<input
				id="filter-to"
				type="date"
				bind:value={toDate}
				class="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-[#3A52A6] focus:outline-none focus:ring-1 focus:ring-[#3A52A6]"
			/>
		</div>
	</div>

	<div class="mt-4 flex justify-end">
		<button
			onclick={generateReport}
			disabled={loading}
			class="flex items-center gap-2 rounded-lg bg-[#3A52A6] px-4 py-2 text-xs text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if loading}
				<div
					class="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent"
				></div>
				Generating...
			{:else}
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
						d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				Generate Report
			{/if}
		</button>
	</div>
</div>

{#if error}
	<div class="mb-5 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-500">{error}</div>
{/if}

{#if report}
	<!-- Summary Cards -->
	<div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-[10px] uppercase tracking-wider text-gray-400">Total Users</p>
			<p class="mt-1 text-2xl font-semibold text-gray-800">{report.summary.total}</p>
		</div>

		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="mb-2 text-[10px] uppercase tracking-wider text-gray-400">By Role</p>
			<div class="space-y-1">
				{#each Object.entries(report.summary.byRole) as [r, count] (r)}
					<div class="flex items-center justify-between">
						<span class="text-xs text-gray-500">{r}</span>
						<span class="text-xs font-medium text-gray-700">{count}</span>
					</div>
				{/each}
				{#if Object.keys(report.summary.byRole).length === 0}
					<p class="text-xs text-gray-400">—</p>
				{/if}
			</div>
		</div>

		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="mb-2 text-[10px] uppercase tracking-wider text-gray-400">By Status</p>
			<div class="space-y-1">
				{#each Object.entries(report.summary.byStatus) as [s, count] (s)}
					<div class="flex items-center justify-between">
						<span class="text-xs text-gray-500">{s}</span>
						<span class="text-xs font-medium text-gray-700">{count}</span>
					</div>
				{/each}
				{#if Object.keys(report.summary.byStatus).length === 0}
					<p class="text-xs text-gray-400">—</p>
				{/if}
			</div>
		</div>

		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="mb-2 text-[10px] uppercase tracking-wider text-gray-400">By Activity</p>
			<div class="space-y-1">
				{#each Object.entries(report.summary.byActivity) as [a, count] (a)}
					<div class="flex items-center justify-between">
						<span class="text-xs text-gray-500">{a}</span>
						<span class="text-xs font-medium text-gray-700">{count}</span>
					</div>
				{/each}
				{#if Object.keys(report.summary.byActivity).length === 0}
					<p class="text-xs text-gray-400">—</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Report Table -->
	<div class="rounded-xl bg-white p-6 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-700">Report Data</p>
				<p class="mt-0.5 text-[10px] text-gray-400">
					{report.data.length} user{report.data.length !== 1 ? 's' : ''} &mdash; Generated {formatDate(
						report.generated_at
					)}
				</p>
			</div>
			<button
				onclick={exportPDF}
				disabled={exportingPDF || report.data.length === 0}
				class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-all hover:border-[#3A52A6] hover:text-[#3A52A6] disabled:cursor-not-allowed disabled:opacity-40"
			>
				{#if exportingPDF}
					<div
						class="h-3.5 w-3.5 animate-spin rounded-full border border-gray-400 border-t-transparent"
					></div>
					Exporting...
				{:else}
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
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Export PDF
				{/if}
			</button>
		</div>

		{#if report.data.length === 0}
			<p class="py-12 text-center text-sm text-gray-400">
				No users match the selected filters.
			</p>
		{:else}
			<table class="w-full">
				<thead>
					<tr class="border-b border-gray-100">
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">#</th>
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Name</th>
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Email</th>
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400">Role</th>
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
							>Status</th
						>
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
							>Profile</th
						>
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
							>Activity</th
						>
						<th class="pb-3 text-left text-[10px] uppercase tracking-wider text-gray-400"
							>Registered</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each report.data as user, i (user.user_id)}
						<tr class="hover:bg-gray-50">
							<td class="py-3 pr-4 text-xs text-gray-400">{i + 1}</td>
							<td class="py-3 pr-4 text-xs text-gray-700">{user.name}</td>
							<td class="py-3 pr-4 text-xs text-gray-500">{user.email}</td>
							<td class="py-3 pr-4">
								<span
									class="rounded-md px-2 py-0.5 text-xs font-medium {roleBadge[user.role] ??
										'bg-gray-50 text-gray-500'}"
								>
									{user.role}
								</span>
							</td>
							<td class="py-3 pr-4">
								<span
									class="flex items-center gap-1.5 text-xs font-medium {statusBadge[user.status]
										?.text ?? 'text-gray-500'}"
								>
									<span
										class="inline-block h-1.5 w-1.5 rounded-full {statusBadge[user.status]?.dot ??
											'bg-gray-400'}"
									></span>
									{user.status}
								</span>
							</td>
							<td
								class="py-3 pr-4 text-xs {user.profile_completion === 'Complete'
									? 'text-green-600'
									: user.profile_completion === 'N/A'
										? 'text-gray-400'
										: 'text-amber-500'}"
							>
								{user.profile_completion}
							</td>
							<td
								class="py-3 pr-4 text-xs font-medium {activityColor[user.activity_level] ??
									'text-gray-500'}"
							>
								{user.activity_level}
							</td>
							<td class="py-3 text-xs text-gray-500">{formatDate(user.registration_date)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{/if}
