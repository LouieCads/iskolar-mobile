import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ForgotPasswordPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true }));

import { goto } from '$app/navigation';

const mockGoto = vi.mocked(goto);

describe('Forgot Password page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the forgot password form', async () => {
		render(ForgotPasswordPage);

		await expect.element(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible();
		await expect.element(page.getByLabelText('Email')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Send OTP' })).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Back to Login' })).toBeVisible();
	});

	it('shows validation error on empty form submission', async () => {
		render(ForgotPasswordPage);

		await page.getByRole('button', { name: 'Send OTP' }).click();

		await expect.element(page.getByText('Email is required')).toBeVisible();
	});

	it('shows validation error for invalid email', async () => {
		render(ForgotPasswordPage);

		await page.getByLabelText('Email').fill('not-an-email');
		await page.getByRole('button', { name: 'Send OTP' }).click();

		await expect.element(page.getByText('Please enter a valid email address')).toBeVisible();
	});

	it('shows server error when OTP send fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: false,
						message: 'Email not found. Please create an account'
					})
			})
		);

		render(ForgotPasswordPage);

		await page.getByLabelText('Email').fill('notfound@example.com');
		await page.getByRole('button', { name: 'Send OTP' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Email not found. Please create an account');
	});

	it('stores email in sessionStorage and redirects to verify-otp on success', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ success: true, message: 'OTP sent successfully to your email' })
			})
		);

		render(ForgotPasswordPage);

		await page.getByLabelText('Email').fill('admin@example.com');
		await page.getByRole('button', { name: 'Send OTP' }).click();

		await vi.waitFor(() => {
			expect(sessionStorage.getItem('reset_email')).toBe('admin@example.com');
			expect(mockGoto).toHaveBeenCalledWith('/verify-otp');
		});

		sessionStorage.removeItem('reset_email');
	});

	it('shows network error when fetch fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

		render(ForgotPasswordPage);

		await page.getByLabelText('Email').fill('admin@example.com');
		await page.getByRole('button', { name: 'Send OTP' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Unable to connect to the server. Please try again.');
	});
});
