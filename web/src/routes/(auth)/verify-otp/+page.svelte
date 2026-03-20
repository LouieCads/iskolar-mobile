<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { API_URL } from '$lib/config';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let otp = $state('');
	let email = $state('');
	let serverError = $state('');
	let resendMessage = $state('');
	let loading = $state(false);
	let resending = $state(false);
	let touched = $state({ otp: false });

	let otpError = $derived(
		!otp && touched.otp
			? 'OTP is required'
			: otp && !/^\d{6}$/.test(otp)
				? 'OTP must be 6 digits'
				: ''
	);

	onMount(() => {
		if (browser) {
			email = sessionStorage.getItem('reset_email') ?? '';
			if (!email) goto('/forgot-password');
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		touched = { otp: true };
		if (otpError || !otp) return;

		serverError = '';
		loading = true;

		try {
			const res = await fetch(`${API_URL}/auth/verify-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp })
			});

			const data = await res.json();

			if (!data.success) {
				serverError = data.message;
				return;
			}

			goto('/reset-password');
		} catch {
			serverError = 'Unable to connect to the server. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleResend() {
		if (!email) return;
		resending = true;
		resendMessage = '';
		serverError = '';

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

			resendMessage = 'OTP resent successfully!';
		} catch {
			serverError = 'Unable to connect to the server. Please try again.';
		} finally {
			resending = false;
		}
	}
</script>

<svelte:head>
	<title>iSkolar — Verify OTP</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-white px-4 py-12">
	<div
		class="w-full max-w-md"
		in:fly={{ x: -20, duration: 300, opacity: 0 }}
	>
		<div class="rounded-2xl bg-[#F0F7FF] px-10 py-8 shadow-[1px_1px_4px_1px_rgba(96,126,242,0.5)] sm:px-6 sm:py-5 md:px-12 md:py-8 lg:px-10 lg:py-6">

			<!-- Header -->
			<div class="mb-8 text-center sm:mb-6">
				<h1 class="mb-1 text-2xl text-[#3F58B2] 2xl:text-3xl">Verify OTP</h1>
				<p class="text-xs text-[#8C8C8C] xl:text-sm">Enter the 6-digit code sent to your email</p>
			</div>

			<!-- Server Error Banner -->
			{#if serverError}
				<div role="alert" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-[#EF4444]">
					{serverError}
				</div>
			{/if}

			<!-- Resend Success Banner -->
			{#if resendMessage}
				<div role="status" class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-xs text-green-600">
					{resendMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} novalidate class="space-y-4 sm:space-y-3">
				<!-- OTP Input -->
				<div>
					<label for="otp" class="mb-1.5 block text-xs text-[#3A52A6] sm:text-[11px] xl:text-sm 2xl:text-base">
						OTP Code
					</label>
					<input
						id="otp"
						type="text"
						inputmode="numeric"
						maxlength="6"
						bind:value={otp}
						onblur={() => (touched.otp = true)}
						disabled={loading}
						placeholder="Enter 6-digit OTP"
						class="w-full rounded-lg border bg-transparent px-4 py-3 text-xs tracking-widest text-[#3A52A6] placeholder:text-[#C4CBD5] transition-all focus:outline-none focus:ring-1 sm:px-3 sm:py-2.5 sm:text-[11px] xl:py-3 xl:text-sm {otpError
							? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
							: 'border-[#C4CBD5] focus:border-[#3A52A6] focus:ring-[#3A52A6]'}"
					/>
					{#if otpError}
						<p class="mt-1 text-[10px] text-[#EF4444] sm:text-[9px] xl:text-xs">{otpError}</p>
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
						<span>Verify OTP</span>
					{/if}
				</button>

				<!-- Resend & Back -->
				<div class="flex items-center justify-between pt-2">
					<button
						type="button"
						disabled={resending}
						onclick={handleResend}
						class="text-xs text-[#3A52A6] hover:underline disabled:opacity-60 sm:text-[11px] xl:text-sm"
					>
						{resending ? 'Resending...' : 'Resend OTP'}
					</button>
					<a href="/forgot-password" class="text-xs text-[#3A52A6] hover:underline sm:text-[11px] xl:text-sm">
						Back
					</a>
				</div>
			</form>
		</div>
	</div>
</div>
