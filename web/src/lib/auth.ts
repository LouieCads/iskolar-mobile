/**
 * Admin web auth helpers — JWT token storage in localStorage.
 *
 * Uses `browser` guard so SvelteKit SSR/prerender passes never touch localStorage.
 * `getToken` automatically clears and returns null when the stored expiry has passed,
 * so callers don't need to check expiration separately.
 */
import { browser } from '$app/environment';

const TOKEN_KEY = 'iskolar_token';
const EXPIRES_KEY = 'iskolar_token_expires';

export function saveToken(token: string, expiresAt: number): void {
	if (!browser) return;
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

export function getToken(): string | null {
	if (!browser) return null;
	const token = localStorage.getItem(TOKEN_KEY);
	const expiresAt = Number(localStorage.getItem(EXPIRES_KEY));
	if (!token) return null;
	if (expiresAt && Date.now() > expiresAt) {
		clearToken();
		return null;
	}
	return token;
}

export function clearToken(): void {
	if (!browser) return;
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(EXPIRES_KEY);
}

export function isAuthenticated(): boolean {
	return getToken() !== null;
}