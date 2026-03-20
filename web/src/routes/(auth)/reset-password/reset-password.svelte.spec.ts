import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ResetPasswordPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true }));

import { goto } from '$app/navigation';

const mockGoto = vi.mocked(goto);

const VALID_PASSWORD = 'Admin@1234';

// Use exact: true to avoid matching the toggle button aria-labels
const confirmPasswordInput = () => page.getByLabelText('Confirm Password', { exact: true });
const newPasswordInput = () => page.getByLabelText('New Password', { exact: true });

describe('Reset Password page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sessionStorage.setItem('reset_email', 'admin@example.com');
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it('renders the reset password form', async () => {
		render(ResetPasswordPage);

		await expect.element(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
		await expect.element(newPasswordInput()).toBeVisible();
		await expect.element(confirmPasswordInput()).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
	});

	it('shows validation errors on empty form submission', async () => {
		render(ResetPasswordPage);

		await page.getByRole('button', { name: 'Reset Password' }).click();

		await expect.element(page.getByText('Password is required')).toBeVisible();
		await expect.element(page.getByText('Please confirm your password')).toBeVisible();
	});

	it('shows validation error for weak password', async () => {
		render(ResetPasswordPage);

		await newPasswordInput().fill('weakpassword');
		await page.getByRole('button', { name: 'Reset Password' }).click();

		await expect
			.element(
				page.getByText(
					'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
				)
			)
			.toBeVisible();
	});

	it('shows validation error when passwords do not match', async () => {
		render(ResetPasswordPage);

		await newPasswordInput().fill(VALID_PASSWORD);
		await confirmPasswordInput().fill('Different@5678');
		await page.getByRole('button', { name: 'Reset Password' }).click();

		await expect.element(page.getByText('Passwords do not match')).toBeVisible();
	});

	it('shows server error on failed password reset', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({ success: false, message: 'OTP not verified. Please verify OTP first.' })
			})
		);

		render(ResetPasswordPage);

		await newPasswordInput().fill(VALID_PASSWORD);
		await confirmPasswordInput().fill(VALID_PASSWORD);
		await page.getByRole('button', { name: 'Reset Password' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('OTP not verified. Please verify OTP first.');
	});

	it('clears sessionStorage and redirects to login on successful reset', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({ success: true, message: 'Password reset successful! Please login' })
			})
		);

		render(ResetPasswordPage);

		await newPasswordInput().fill(VALID_PASSWORD);
		await confirmPasswordInput().fill(VALID_PASSWORD);
		await page.getByRole('button', { name: 'Reset Password' }).click();

		await vi.waitFor(() => {
			expect(sessionStorage.getItem('reset_email')).toBeNull();
			expect(mockGoto).toHaveBeenCalledWith('/login');
		});
	});

	it('shows network error when fetch fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

		render(ResetPasswordPage);

		await newPasswordInput().fill(VALID_PASSWORD);
		await confirmPasswordInput().fill(VALID_PASSWORD);
		await page.getByRole('button', { name: 'Reset Password' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Unable to connect to the server. Please try again.');
	});

	it('toggles new password visibility', async () => {
		render(ResetPasswordPage);

		const passwordInput = newPasswordInput();
		await expect.element(passwordInput).toHaveAttribute('type', 'password');

		await page.getByRole('button', { name: 'Show password' }).click();
		await expect.element(passwordInput).toHaveAttribute('type', 'text');

		await page.getByRole('button', { name: 'Hide password' }).click();
		await expect.element(passwordInput).toHaveAttribute('type', 'password');
	});

	it('toggles confirm password visibility', async () => {
		render(ResetPasswordPage);

		const confirmInput = confirmPasswordInput();
		await expect.element(confirmInput).toHaveAttribute('type', 'password');

		await page.getByRole('button', { name: 'Show confirm password' }).click();
		await expect.element(confirmInput).toHaveAttribute('type', 'text');

		await page.getByRole('button', { name: 'Hide confirm password' }).click();
		await expect.element(confirmInput).toHaveAttribute('type', 'password');
	});
});
