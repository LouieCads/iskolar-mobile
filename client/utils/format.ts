export const formatDate = (dateString?: string, fallback = 'No date'): string => {
  if (!dateString) return fallback;
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString?: string, fallback = 'No date'): string => {
  if (!dateString) return fallback;
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatAmount = (value?: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) return '₱ 0.00';
  return `₱ ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatTag = (text: string): string =>
  text.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');

export const formatLabel = (text: string): string =>
  text.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
