/**
 * Admin API client — thin fetch wrappers for the admin web dashboard.
 *
 * Each function attaches the JWT from auth.ts and delegates JSON parsing to
 * the caller. Filtering and pagination are passed as `params` query-string objects.
 */
import { getToken } from '$lib/auth';
import { API_URL } from '$lib/config';

export async function fetchScholarships(params: Record<string, string>) {
	const token = getToken();
	const searchParams = new URLSearchParams(params);
	const res = await fetch(`${API_URL}/admin/scholarships?${searchParams}`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	return res.json();
}

export async function fetchScholarshipById(scholarshipId: string) {
	const token = getToken();
	const res = await fetch(`${API_URL}/admin/scholarships/${scholarshipId}`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	return res.json();
}

export async function fetchUsers(params: Record<string, string>) {
	const token = getToken();
	const searchParams = new URLSearchParams(params);
	const res = await fetch(`${API_URL}/admin/users?${searchParams}`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	return res.json();
}

export async function fetchUserById(userId: string) {
	const token = getToken();
	const res = await fetch(`${API_URL}/admin/users/${userId}`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	return res.json();
}

export async function fetchDashboardStats() {
	const token = getToken();
	const res = await fetch(`${API_URL}/admin/dashboard`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	return res.json();
}
