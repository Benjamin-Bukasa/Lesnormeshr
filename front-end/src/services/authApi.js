const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Erreur API');
  }

  return payload;
}

export async function getCurrentAuthProfile() {
  return apiRequest('/api/auth/me');
}

export async function login(body) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body,
  });
}

export async function requestPasswordReset(body) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body,
  });
}

export async function resetPassword(body) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body,
  });
}

export async function updateCurrentAuthProfile(body) {
  return apiRequest('/api/auth/me', {
    method: 'PATCH',
    body,
  });
}

export async function uploadCurrentAuthAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/auth/me/avatar`, {
    method: 'PATCH',
    credentials: 'include',
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Erreur API');
  }

  return payload;
}

export async function changeCurrentPassword(body) {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body,
  });
}
