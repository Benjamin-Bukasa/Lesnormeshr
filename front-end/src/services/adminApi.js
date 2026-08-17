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

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }

    query.set(key, String(value));
  });

  const suffix = query.toString();
  return suffix ? `?${suffix}` : '';
}

export async function getAccessOptions() {
  return apiRequest('/api/admin/access/options');
}

export async function listAdminUsers(params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await apiRequest(`/api/admin/users${suffix}`);

  return {
    users: payload.users || [],
    pagination: payload.pagination || null,
  };
}

export async function createAdminUser(body) {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body,
  });
}

export async function updateAdminUserAccess(userId, body) {
  return apiRequest(`/api/admin/users/${userId}/access`, {
    method: 'PATCH',
    body,
  });
}

export async function updateAdminUserStatus(userId, body) {
  return apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body,
  });
}

export async function listDepartments(params = {}) {
  const payload = await apiRequest(`/api/admin/departments${buildQuery(params)}`);
  return {
    departments: payload.departments || [],
  };
}

export async function createDepartment(body) {
  const payload = await apiRequest('/api/admin/departments', {
    method: 'POST',
    body,
  });

  return payload.department;
}

export async function updateDepartment(departmentId, body) {
  const payload = await apiRequest(`/api/admin/departments/${departmentId}`, {
    method: 'PATCH',
    body,
  });

  return payload.department;
}

export async function deleteDepartment(departmentId) {
  return apiRequest(`/api/admin/departments/${departmentId}`, {
    method: 'DELETE',
  });
}
