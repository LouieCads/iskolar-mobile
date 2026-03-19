<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { API_URL } from '$lib/config';
	import { saveToken, isAuthenticated } from '$lib/auth';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let serverError = $state('');
	let loading = $state(false);
	let showPassword = $state(false);
	let touched = $state({ email: false, password: false });

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	let emailError = $derived(
		!email && touched.email
			? 'Email is required'
			: email && !emailRegex.test(email)
				? 'Please enter a valid email address'
				: ''
	);

	let passwordError = $derived(
		!password && touched.password
			? 'Password is required'
			: password && password.length < 8
				? 'Password must be at least 8 characters'
				: ''
	);

	onMount(() => {
		if (isAuthenticated()) goto('/dashboard');
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		touched = { email: true, password: true };
		if (emailError || passwordError || !email || !password) return;

		serverError = '';
		loading = true;

		try {
			const res = await fetch(`${API_URL}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, rememberMe })
			});

			const data = await res.json();

			if (!data.success) {
				serverError = data.message;
				return;
			}

			saveToken(data.token, data.expiresAt);
			goto('/dashboard');
		} catch {
			serverError = 'Unable to connect to the server. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>iSkolar — Log In</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-white px-4 py-12">
	<div
		class="w-full max-w-md"
		in:fly={{ x: -20, duration: 300, opacity: 0 }}
	>
		<div class="min-h-[450px] rounded-2xl bg-[#F0F7FF] px-10 py-6 shadow-[1px_1px_4px_1px_rgba(96,126,242,0.5)] sm:px-6 sm:py-5 md:px-12 md:py-8 lg:px-10 lg:py-6">

			<!-- Header -->
			<div class="mb-8 text-center sm:mb-6">
				<h1 class="mb-1 text-2xl text-[#3F58B2] 2xl:text-3xl">Log In</h1>
			</div>

			<!-- Server Error Banner -->
			{#if serverError}
				<div role="alert" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-[#EF4444]">
					{serverError}
				</div>
			{/if}

			<form onsubmit={handleLogin} novalidate class="space-y-4 sm:space-y-3">
				<!-- Email -->
				<div>
					<label for="email" class="mb-1.5 block text-xs text-[#3A52A6] sm:text-[11px] xl:text-sm 2xl:text-base">
						Email
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						onblur={() => (touched.email = true)}
						autocomplete="email"
						disabled={loading}
						placeholder="Enter Email"
						class="w-full rounded-lg border bg-transparent px-4 py-3 text-xs text-[#3A52A6] placeholder:text-[#C4CBD5] transition-all focus:outline-none focus:ring-1 sm:px-3 sm:py-2.5 sm:text-[11px] xl:py-3 xl:text-sm {emailError
							? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
							: 'border-[#C4CBD5] focus:border-[#3A52A6] focus:ring-[#3A52A6]'}"
					/>
					{#if emailError}
						<p class="mt-1 text-[10px] text-[#EF4444] sm:text-[9px] xl:text-xs">{emailError}</p>
					{/if}
				</div>

				<!-- Password -->
				<div>
					<label for="password" class="mb-1.5 block text-xs text-[#3A52A6] sm:text-[11px] xl:text-sm">
						Password
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							onblur={() => (touched.password = true)}
							autocomplete="current-password"
							disabled={loading}
							placeholder="Enter Password"
							class="w-full rounded-lg border bg-transparent px-4 py-3 pr-10 text-xs text-[#3A52A6] placeholder:text-[#C4CBD5] transition-all focus:outline-none focus:ring-1 sm:px-3 sm:py-2.5 sm:text-[11px] xl:py-3 xl:text-sm {passwordError
								? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
								: 'border-[#C4CBD5] focus:border-[#3A52A6] focus:ring-[#3A52A6]'}"
						/>
						<button
							type="button"
							tabindex="-1"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#8C8C8C] transition-colors hover:text-[#3A52A6]"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<svg class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
								</svg>
							{:else}
								<svg class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
								</svg>
							{/if}
						</button>
					</div>
					{#if passwordError}
						<p class="mt-1 text-[10px] text-[#EF4444] sm:text-[9px] xl:text-xs">{passwordError}</p>
					{/if}
				</div>

				<!-- Remember Me & Forgot Password -->
				<div class="mt-5 flex items-center justify-between text-xs xl:text-sm sm:mt-4">
					<label class="flex cursor-pointer items-center">
						<input
							type="checkbox"
							id="rememberMe"
							bind:checked={rememberMe}
							disabled={loading}
							class="h-3 w-3 cursor-pointer rounded-lg border-[#C4CBD5] text-[#3A52A6] focus:ring-[#3A52A6] sm:h-3.5 sm:w-3.5 xl:h-4 xl:w-4"
						/>
						<span class="ml-1 text-xs text-[#8C8C8C] sm:text-[11px] xl:text-sm">Remember Me</span>
					</label>
					<a href="/forgot-password" class="text-xs text-[#3A52A6] hover:underline sm:text-[11px] xl:text-sm">
						Forgot password?
					</a>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={loading}
					class="mt-6 w-full cursor-pointer rounded-lg bg-[#3A52A6] py-3 text-xs text-[#F0F7FF] transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] active:shadow-md sm:mt-10 sm:py-3 sm:text-[11px] xl:py-3.5 xl:text-sm {loading
						? 'cursor-not-allowed opacity-60'
						: ''}"
				>
					{#if loading}
						<span class="flex items-center justify-center">
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
						</span>
					{:else}
						<span>Log In</span>
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>