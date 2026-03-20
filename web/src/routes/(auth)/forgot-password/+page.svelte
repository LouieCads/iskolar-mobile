<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { API_URL } from '$lib/config';

	let email = $state('');
	let serverError = $state('');
	let loading = $state(false);
	let touched = $state({ email: false });

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	let emailError = $derived(
		!email && touched.email
			? 'Email is required'
			: email && !emailRegex.test(email)
				? 'Please enter a valid email address'
				: ''
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		touched = { email: true };
		if (emailError || !email) return;

		serverError = '';
		loading = true;

		try {
			const res = await fetch(`${API_URL}/auth/send-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await res.json();

			if (!data.success) {
				serverError = data.message;
				return;
			}

			sessionStorage.setItem('reset_email', email);
			goto('/verify-otp');
		} catch {
			serverError = 'Unable to connect to the server. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>iSkolar — Forgot Password</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-white px-4 py-12">
	<div
		class="w-full max-w-md"
		in:fly={{ x: -20, duration: 300, opacity: 0 }}
	>
		<div class="rounded-2xl bg-[#F0F7FF] px-10 py-8 shadow-[1px_1px_4px_1px_rgba(96,126,242,0.5)] sm:px-6 sm:py-5 md:px-12 md:py-8 lg:px-10 lg:py-6">

			<!-- Header -->
			<div class="mb-8 text-center sm:mb-6">
				<h1 class="mb-1 text-2xl text-[#3F58B2] 2xl:text-3xl">Forgot Password</h1>
				<p class="text-xs text-[#8C8C8C] xl:text-sm">Enter your email to receive a one-time password</p>
			</div>

			<!-- Server Error Banner -->
			{#if serverError}
				<div role="alert" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-[#EF4444]">
					{serverError}
				</div>
			{/if}

			<form onsubmit={handleSubmit} novalidate class="space-y-4 sm:space-y-3">
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

				<!-- Submit -->
				<button
					type="submit"
					disabled={loading}
					class="mt-6 w-full cursor-pointer rounded-lg bg-[#3A52A6] py-3 text-xs text-[#F0F7FF] transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] active:shadow-md sm:mt-8 sm:py-3 sm:text-[11px] xl:py-3.5 xl:text-sm {loading
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
						<span>Send OTP</span>
					{/if}
				</button>

				<!-- Back link -->
				<div class="pt-2 text-center">
					<a href="/login" class="text-xs text-[#3A52A6] hover:underline sm:text-[11px] xl:text-sm">
						Back to Login
					</a>
				</div>
			</form>
		</div>
	</div>
</div>
