<script lang="ts">
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';
	import { saveToken, isAuthenticated } from '$lib/auth';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let error = $state('');
	let loading = $state(false);
	let showPassword = $state(false);

	onMount(() => {
		if (isAuthenticated()) goto('/dashboard');
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await fetch(`${API_URL}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, rememberMe })
			});

			const data = await res.json();

			if (!data.success) {
				error = data.message;
				return;
			}

			saveToken(data.token, data.expiresAt);
			goto('/dashboard');
		} catch {
			error = 'Unable to connect to the server. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>iSkolar - Login</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-4">
	<div class="w-full max-w-md">
		<!-- Logo / Brand -->
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold tracking-tight text-white">iSkolar</h1>
			<p class="mt-1 text-sm text-blue-200">Admin Portal</p>
		</div>

		<!-- Card -->
		<div class="rounded-2xl bg-white p-8 shadow-2xl">
			<h2 class="mb-6 text-xl font-semibold text-gray-800">Sign in to your account</h2>

			<!-- Error Banner -->
			{#if error}
				<div role="alert" class="mb-5 flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
					<svg class="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={handleLogin} novalidate class="space-y-5">
				<!-- Email -->
				<div>
					<label for="email" class="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						autocomplete="email"
						required
						disabled={loading}
						placeholder="admin@example.com"
						class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
					/>
				</div>

				<!-- Password -->
				<div>
					<label for="password" class="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							autocomplete="current-password"
							required
							disabled={loading}
							placeholder="••••••••"
							class="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
								</svg>
							{:else}
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- Remember me -->
				<div class="flex items-center gap-2.5">
					<input
						id="rememberMe"
						type="checkbox"
						bind:checked={rememberMe}
						disabled={loading}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
					/>
					<label for="rememberMe" class="text-sm text-gray-600">Remember me for 30 days</label>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={loading}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if loading}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						Signing in…
					{:else}
						Sign in
					{/if}
				</button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-blue-300">
			iSkolar &copy; {new Date().getFullYear()}
		</p>
	</div>
</div>
