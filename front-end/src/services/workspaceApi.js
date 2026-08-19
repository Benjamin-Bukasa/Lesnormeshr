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

export async function getWorkspaceSummary() {
  return apiRequest('/api/workspace/summary');
}

export async function updateWorkspaceTask(taskId, done) {
  const payload = await apiRequest(`/api/workspace/tasks/${taskId}`, {
    method: 'PATCH',
    body: { done },
  });

  return payload.task;
}

export async function clearCompletedWorkspaceTasks() {
  return apiRequest('/api/workspace/tasks/completed', { method: 'DELETE' });
}

export async function markWorkspaceNotificationsRead() {
  return apiRequest('/api/workspace/notifications/read', { method: 'POST' });
}

export async function markWorkspaceMessagesRead() {
  return apiRequest('/api/workspace/messages/read', { method: 'POST' });
}
