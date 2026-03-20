import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import VerifyOTPPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true }));

import { goto } from '$app/navigation';

const mockGoto = vi.mocked(goto);

describe('Verify OTP page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sessionStorage.setItem('reset_email', 'admin@example.com');
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it('renders the verify OTP form', async () => {
		render(VerifyOTPPage);

		await expect.element(page.getByRole('heading', { name: 'Verify OTP' })).toBeVisible();
		await expect.element(page.getByLabelText('OTP Code')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Verify OTP' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Resend OTP' })).toBeVisible();
	});

	it('shows validation error on empty form submission', async () => {
		render(VerifyOTPPage);

		await page.getByRole('button', { name: 'Verify OTP' }).click();

		await expect.element(page.getByText('OTP is required')).toBeVisible();
	});

	it('shows validation error for non-6-digit OTP', async () => {
		render(VerifyOTPPage);

		await page.getByLabelText('OTP Code').fill('123');
		await page.getByRole('button', { name: 'Verify OTP' }).click();

		await expect.element(page.getByText('OTP must be 6 digits')).toBeVisible();
	});

	it('shows server error on invalid OTP', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({ success: false, message: 'Invalid OTP. Please try again.' })
			})
		);

		render(VerifyOTPPage);

		await page.getByLabelText('OTP Code').fill('000000');
		await page.getByRole('button', { name: 'Verify OTP' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Invalid OTP. Please try again.');
	});

	it('redirects to reset-password on successful OTP verification', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ success: true, message: 'OTP verified successfully' })
			})
		);

		render(VerifyOTPPage);

		await page.getByLabelText('OTP Code').fill('123456');
		await page.getByRole('button', { name: 'Verify OTP' }).click();

		await vi.waitFor(() => {
			expect(mockGoto).toHaveBeenCalledWith('/reset-password');
		});
	});

	it('shows success message after resending OTP', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ success: true, message: 'OTP sent successfully to your email' })
			})
		);

		render(VerifyOTPPage);

		await page.getByRole('button', { name: 'Resend OTP' }).click();

		await expect.element(page.getByRole('status')).toHaveTextContent('OTP resent successfully!');
	});

	it('shows server error when resend fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ success: false, message: 'Email not found. Please create an account' })
			})
		);

		render(VerifyOTPPage);

		await page.getByRole('button', { name: 'Resend OTP' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Email not found. Please create an account');
	});

	it('shows network error when fetch fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

		render(VerifyOTPPage);

		await page.getByLabelText('OTP Code').fill('123456');
		await page.getByRole('button', { name: 'Verify OTP' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Unable to connect to the server. Please try again.');
	});
});
