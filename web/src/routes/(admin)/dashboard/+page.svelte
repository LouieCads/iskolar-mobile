<script lang="ts">
	const statCards = [
		{
			label: 'TOTAL REGISTERED USERS',
			value: '2481',
			subtitle: '↑ 12% this month',
			subtitleColor: 'text-green-500',
			borderColor: 'border-t-blue-500',
	
			iconColor: 'text-blue-500',
			icon: 'users-group'
		},
		{
			label: 'ACTIVE SCHOLARSHIPS',
			value: '36',
			subtitle: '4 new this week',
			subtitleColor: 'text-green-500',
			borderColor: 'border-t-emerald-400',
	
			iconColor: 'text-emerald-500',
			icon: 'scholarship'
		},
		{
			label: 'TOTAL APPLICATIONS',
			value: '1204',
			subtitle: '↑ 8% this month',
			subtitleColor: 'text-green-500',
			borderColor: 'border-t-amber-400',
	
			iconColor: 'text-amber-500',
			icon: 'document-list'
		},
		{
			label: 'APPROVED APPLICATIONS',
			value: '847',
			subtitle: '70% approval rate',
			subtitleColor: 'text-green-500',
			borderColor: 'border-t-blue-500',
	
			iconColor: 'text-blue-500',
			icon: 'document-check'
		},
		{
			label: 'ACTIVE STUDENTS',
			value: '2180',
			subtitle: '↑ 12% this month',
			subtitleColor: 'text-green-500',
			borderColor: 'border-t-blue-500',
	
			iconColor: 'text-blue-500',
			icon: 'students'
		},
		{
			label: 'ACTIVE SPONSORS',
			value: '52',
			subtitle: '↑ 3 new',
			subtitleColor: 'text-green-500',
			borderColor: 'border-t-amber-400',
	
			iconColor: 'text-amber-500',
			icon: 'building'
		},
		{
			label: 'TOTAL SCHOLARSHIPS POSTED',
			value: '66',
			subtitle: '↑ 2 this week',
			subtitleColor: 'text-green-500',
			borderColor: 'border-t-indigo-400',
	
			iconColor: 'text-indigo-500',
			icon: 'clipboard'
		},
		{
			label: 'DENIED APPLICATIONS',
			value: '357',
			subtitle: '29.7% denial rate',
			subtitleColor: 'text-red-500',
			borderColor: 'border-t-red-400',
	
			iconColor: 'text-red-400',
			icon: 'document-x'
		}
	];

	const chartData = [
		{ month: 'Jan', pct: 42 },
		{ month: 'Feb', pct: 53 },
		{ month: 'Mar', pct: 57 },
		{ month: 'Apr', pct: 50 },
		{ month: 'May', pct: 63 },
		{ month: 'Jun', pct: 67 },
		{ month: 'Jul', pct: 61 },
		{ month: 'Aug', pct: 68 },
		{ month: 'Sep', pct: 73 },
		{ month: 'Oct', pct: 83 },
		{ month: 'Nov', pct: 89 },
		{ month: 'Dec', pct: 68 }
	];

	const scholarshipBreakdown = [
		{ label: 'Active', count: 36, color: 'bg-emerald-500', pct: 54 },
		{ label: 'Closed', count: 18, color: 'bg-gray-400', pct: 27 },
		{ label: 'Suspended', count: 5, color: 'bg-amber-400', pct: 8 },
		{ label: 'Archived', count: 8, color: 'bg-gray-300', pct: 12 }
	];

	const recentActivity = [
		{
			text: 'New student Bill Gates registered and completed profile setup.',
			time: '5 minutes ago'
		},
		{
			text: 'Sponsor CHED Foundation posted a new scholarship: CHED Merit Scholarship 2025.',
			time: '10 minutes ago'
		},
		{ text: 'User John Lou Manuel was suspended for policy violation.', time: '1 hour ago' },
		{
			text: 'Scholarship SM Foundation Grant archived. 120 applications closed.',
			time: '3 hours ago'
		},
		{
			text: 'User report exported for period: January – June 2025.',
			time: 'Yesterday, 6:30 PM'
		}
	];

	const actionShortcuts = [
		{ label: 'User List', href: '/user-management', icon: 'users' },
		{ label: 'Scholarship List', href: '/scholarship-management', icon: 'scholarship' },
		{ label: 'User Reports', href: '/user-reports', icon: 'reports' },
		{ label: 'Scholarship Reports', href: '/scholarship-reports', icon: 'bar-chart' }
	];

	const userDistribution = [
		{ label: 'Students', count: 2180, color: 'bg-blue-500', pct: 98 },
		{ label: 'Sponsors', count: 52, color: 'bg-amber-400', pct: 2 }
	];
</script>

<svelte:head>
	<title>iSkolar — Dashboard</title>
</svelte:head>

<!-- Export Button -->
<div class="mb-4 flex justify-end">
	<button
		class="flex items-center gap-2 rounded-lg bg-[#3A52A6] px-4 py-2 text-xs text-white shadow transition-all hover:bg-[#2d3f8a] hover:shadow-md active:scale-95"
	>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
			/>
		</svg>
		Export Report
	</button>
</div>

<!-- Stat Cards — Row 1 -->
<div class="mb-4 grid grid-cols-4 gap-4">
	{#each statCards as card}
		<div
			class="rounded-xl border-t-4 bg-white p-4 shadow-sm {card.borderColor} flex flex-col gap-2"
		>
			<div
				class="flex h-9 w-9 items-center justify-center rounded-lg {card.iconColor}"
			>
				{#if card.icon === 'users-group'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
				{:else if card.icon === 'scholarship'}
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
						/>
					</svg>
				{:else if card.icon === 'document-list'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				{:else if card.icon === 'document-check'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{:else if card.icon === 'students'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
						/>
					</svg>
				{:else if card.icon === 'building'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
						/>
					</svg>
				{:else if card.icon === 'clipboard'}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
						/>
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				{/if}
			</div>
			<div>
				<p class="text-[10px] font-semibold tracking-wide text-gray-400">{card.label}</p>
				<p class="text-2xl font-bold text-gray-800">{card.value}</p>
				<p class="text-xs {card.subtitleColor}">{card.subtitle}</p>
			</div>
		</div>
	{/each}
</div>

<!-- Middle Section: Chart + Right Column -->
<div class="mb-4 flex gap-4">
	<!-- Bar Chart -->
	<div class="flex-1 rounded-xl bg-white p-5 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-gray-700">User Registrations — 2025</h2>
			<div
				class="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500"
			>
				This Year
				<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>
		<!-- Chart bars -->
		<div class="flex h-36 items-end gap-1.5">
			{#each chartData as bar}
				<div class="flex flex-1 flex-col items-center gap-1">
					<div
						class="w-full rounded-t-sm bg-[#3A52A6] opacity-80 transition-all hover:opacity-100"
						style="height: {bar.pct}%"
					></div>
					<span class="text-[9px] text-gray-400">{bar.month}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Right Column -->
	<div class="flex w-72 flex-shrink-0 flex-col gap-4">
		<!-- Scholarship Breakdown -->
		<div class="rounded-xl bg-white p-5 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold text-gray-700">Scholarship Breakdown</h2>
			<div class="space-y-3">
				{#each scholarshipBreakdown as item}
					<div>
						<div class="mb-1 flex items-center justify-between text-xs">
							<span class="text-gray-500">{item.label}</span>
							<span class="font-semibold text-gray-700">{item.count}</span>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
							<div class="h-full rounded-full {item.color}" style="width: {item.pct}%"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- User Distribution -->
		<div class="rounded-xl bg-white p-5 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold text-gray-700">User Distribution</h2>
			<div class="space-y-3">
				{#each userDistribution as item}
					<div>
						<div class="mb-1 flex items-center justify-between text-xs">
							<span class="text-gray-500">{item.label}</span>
							<span class="font-semibold text-gray-700">{item.count}</span>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
							<div class="h-full rounded-full {item.color}" style="width: {item.pct}%"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Bottom Section -->
<div class="flex gap-4">
	<!-- Recent Activity -->
	<div class="flex-1 rounded-xl bg-white p-5 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold text-gray-700">Recent Activity</h2>
		<ul class="space-y-3">
			{#each recentActivity as activity}
				<li class="flex gap-2">
					<div class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#3A52A6]"></div>
					<div>
						<p class="text-xs leading-relaxed text-gray-600">{activity.text}</p>
						<p class="mt-0.5 text-[10px] text-gray-400">{activity.time}</p>
					</div>
				</li>
			{/each}
		</ul>
	</div>

	<!-- Action Shortcuts -->
	<div class="w-56 flex-shrink-0 rounded-xl bg-white p-5 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold text-gray-700">Action Shortcuts</h2>
		<div class="grid grid-cols-2 gap-3">
			{#each actionShortcuts as shortcut}
				<a
					href={shortcut.href}
					class="flex flex-col items-center gap-2 rounded-lg border border-gray-100 p-3 text-center transition-all hover:border-[#3A52A6] hover:bg-[#EEF2FF] hover:shadow-sm"
				>
					<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500">
						{#if shortcut.icon === 'users'}
							<svg
								class="h-4.5 w-4.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						{:else if shortcut.icon === 'scholarship'}
							<svg class="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
								/>
							</svg>
						{:else if shortcut.icon === 'reports'}
							<svg
								class="h-4.5 w-4.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						{:else}
							<svg
								class="h-4.5 w-4.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						{/if}
					</div>
					<span class="text-[10px] leading-tight text-gray-600">{shortcut.label}</span>
				</a>
			{/each}
		</div>
	</div>
</div>
