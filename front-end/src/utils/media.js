const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function resolveMediaUrl(value) {
  const url = String(value || '').trim();

  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;
}
