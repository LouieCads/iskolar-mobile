export function formatDate(dateStr?: string | null, fallback = '—'): string {
	if (!dateStr) return fallback;
	return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr?: string | null, fallback = '—'): string {
	if (!dateStr) return fallback;
	return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatAmount(amount: number): string {
	return new Intl.NumberFormat('en-PH', {
		style: 'currency',
		currency: 'PHP',
		maximumFractionDigits: 0
	}).format(amount);
}

export function isDeadlinePassed(dateStr: string | null): boolean {
	if (!dateStr) return false;
	return new Date(dateStr) < new Date();
}

export function formatType(type: string | null): string {
	if (!type) return '—';
	return type === 'merit_based' ? 'Merit-Based' : 'Skill-Based';
}

export function formatPurpose(purpose: string | null): string {
	if (!purpose) return '—';
	return purpose === 'allowance' ? 'Allowance' : 'Tuition';
}

export function getVisiblePages(currentPage: number, totalPages: number): (number | '...')[] {
	if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
	if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
	if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
	return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}
