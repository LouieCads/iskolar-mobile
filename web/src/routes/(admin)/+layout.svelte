<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { clearToken } from '$lib/auth';

	let { children } = $props();

	const navSections = [
		{
			label: 'Overview',
			items: [{ label: 'Dashboard', href: '/dashboard', icon: 'dashboard' }]
		},
		{
			label: 'Management',
			items: [
				{ label: 'User Management', href: '/user-management', icon: 'users' },
				{ label: 'Scholarships', href: '/scholarship-management', icon: 'scholarship' }
			]
		},
		{
			label: 'Analytics',
			items: [
				{ label: 'User Reports', href: '/user-reports', icon: 'reports' },
				{ label: 'Scholarship Reports', href: '/scholarship-reports', icon: 'bar-chart' }
			]
		}
	];

	const breadcrumbMap: Record<string, { section: string; label: string }> = {
		'/dashboard': { section: 'Overview', label: 'Dashboard' },
		'/user-management': { section: 'Management', label: 'User Management' },
		'/scholarship-management': { section: 'Management', label: 'Scholarships' },
		'/user-reports': { section: 'Analytics', label: 'User Reports' },
		'/scholarship-reports': { section: 'Analytics', label: 'Scholarship Reports' }
	};

	let breadcrumb = $derived(
		breadcrumbMap[page.url.pathname] ?? { section: 'Overview', label: 'Dashboard' }
	);

	function handleLogout() {
		clearToken();
		goto('/login');
	}
</script>

<div class="flex h-screen overflow-hidden bg-[#F0F4F8]">
	<!-- Sidebar -->
	<aside class="flex w-44 shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm">
		<!-- Logo -->
		<div class="flex items-center gap-2.5 border-b border-gray-100 p-4">
			<div
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3A52A6]"
			>
				<svg
					class="h-5 w-5 text-white"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
					/>
				</svg>
			</div>
			<div>
				<p class="text-sm leading-tight text-[#3A52A6]">iSkolar</p>
				<p class="text-[10px] text-gray-400">Admin</p>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 space-y-3 overflow-y-auto px-2 py-3">
			{#each navSections as section}
				<div>
					<p class="mb-1 px-2 text-[9px] uppercase tracking-widest text-gray-400">
						{section.label}
					</p>
					{#each section.items as item}
						<a
							href={item.href}
							class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors {page.url
								.pathname === item.href
								? 'bg-[#EEF2FF] text-[#3A52A6]'
								: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
						>
							{#if item.icon === 'dashboard'}
								<svg
									class="h-3.5 w-3.5 flex-shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
									/>
								</svg>
							{:else if item.icon === 'users'}
								<svg
									class="h-3.5 w-3.5 flex-shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							{:else if item.icon === 'scholarship'}
								<svg
									class="h-3.5 w-3.5 flex-shrink-0"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
									/>
								</svg>
							{:else if item.icon === 'reports'}
								<svg
									class="h-3.5 w-3.5 flex-shrink-0"
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
							{:else}
								<svg
									class="h-3.5 w-3.5 flex-shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							{/if}
							{item.label}
						</a>
					{/each}
				</div>
			{/each}
		</nav>

		<!-- Admin User -->
		<div class="flex items-center gap-2 border-t border-gray-100 p-3">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3A52A6] text-xs text-white"
			>
				A
			</div>
			<div class="min-w-0">
				<p class="truncate text-xs text-gray-700">Admin User</p>
				<p class="truncate text-[10px] text-gray-400">Super Administrator</p>
			</div>
			<button
				onclick={handleLogout}
				title="Logout"
				class="ml-auto shrink-0 text-gray-300 transition-colors hover:text-gray-500"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
			</button>
		</div>
	</aside>

	<!-- Main Area -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Top Header -->
		<header
			class="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-3"
		>
			<p class="text-sm text-gray-400">
				{breadcrumb.section} &rsaquo;
				<span class="text-gray-700">{breadcrumb.label}</span>
			</p>
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full bg-[#3A52A6] text-sm text-white"
			>
				A
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
