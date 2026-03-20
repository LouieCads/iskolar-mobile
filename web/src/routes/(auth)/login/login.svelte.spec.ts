import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoginPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/auth', () => ({
	isAuthenticated: vi.fn(() => false),
	saveToken: vi.fn()
}));

import { goto } from '$app/navigation';
import { isAuthenticated, saveToken } from '$lib/auth';

const mockGoto = vi.mocked(goto);
const mockIsAuthenticated = vi.mocked(isAuthenticated);
const mockSaveToken = vi.mocked(saveToken);

describe('Login page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsAuthenticated.mockReturnValue(false);
	});

	it('renders the login form', async () => {
		render(LoginPage);

		await expect.element(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
		await expect.element(page.getByLabelText('Email')).toBeVisible();
		await expect.element(page.getByLabelText('Password', { exact: true })).toBeVisible();
		await expect.element(page.getByLabelText('Remember Me')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Log In' })).toBeVisible();
	});

	it('redirects to dashboard when already authenticated', async () => {
		mockIsAuthenticated.mockReturnValue(true);

		render(LoginPage);

		await vi.waitFor(() => {
			expect(mockGoto).toHaveBeenCalledWith('/dashboard');
		});
	});

	it('shows error message on failed login', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ success: false, message: 'Invalid email or password' })
			})
		);

		render(LoginPage);

		await page.getByLabelText('Email').fill('admin@example.com');
		await page.getByLabelText('Password', { exact: true }).fill('wrongpassword');
		await page.getByRole('button', { name: 'Log In' }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent('Invalid email or password');
	});

	it('saves token and redirects to dashboard on successful login', async () => {
		const fakeToken = 'fake.jwt.token';
		const fakeExpiry = Date.now() + 86400000;

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: true,
						token: fakeToken,
						expiresAt: fakeExpiry,
						user: { id: 'abc-123', email: 'admin@example.com' }
					})
			})
		);

		render(LoginPage);

		await page.getByLabelText('Email').fill('admin@example.com');
		await page.getByLabelText('Password', { exact: true }).fill('correctpassword');
		await page.getByRole('button', { name: 'Log In' }).click();

		await vi.waitFor(() => {
			expect(mockSaveToken).toHaveBeenCalledWith(fakeToken, fakeExpiry);
			expect(mockGoto).toHaveBeenCalledWith('/dashboard');
		});
	});

	it('shows network error when fetch fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

		render(LoginPage);

		await page.getByLabelText('Email').fill('admin@example.com');
		await page.getByLabelText('Password', { exact: true }).fill('anypassword');
		await page.getByRole('button', { name: 'Log In' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Unable to connect to the server. Please try again.');
	});

	it('toggles password visibility', async () => {
		render(LoginPage);

		const passwordInput = page.getByLabelText('Password', { exact: true });
		await expect.element(passwordInput).toHaveAttribute('type', 'password');

		await page.getByRole('button', { name: 'Show password' }).click();
		await expect.element(passwordInput).toHaveAttribute('type', 'text');

		await page.getByRole('button', { name: 'Hide password' }).click();
		await expect.element(passwordInput).toHaveAttribute('type', 'password');
	});
});
