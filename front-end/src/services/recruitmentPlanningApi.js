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

export async function getRecruitmentPlanning() {
  const payload = await apiRequest('/api/talent-acquisition/planning');
  return payload.data;
}

export async function getRecruitmentPlanningHistory(params = {}) {
  const query = new URLSearchParams();

  if (params.entityType) query.set('entityType', params.entityType);
  if (params.entityId) query.set('entityId', params.entityId);
  if (params.limit) query.set('limit', String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await apiRequest(`/api/talent-acquisition/planning/history${suffix}`);
  return payload.data;
}

export async function createWeeklyPlan(body) {
  const payload = await apiRequest('/api/talent-acquisition/planning/weekly', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updateWeeklyPlan(weeklyPlanId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/planning/weekly/${weeklyPlanId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deleteWeeklyPlan(weeklyPlanId) {
  const payload = await apiRequest(`/api/talent-acquisition/planning/weekly/${weeklyPlanId}`, {
    method: 'DELETE',
    body: {},
  });
  return payload.data;
}

export async function createPipelineStep(body) {
  const payload = await apiRequest('/api/talent-acquisition/planning/pipeline', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updatePipelineStep(pipelineStepId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/planning/pipeline/${pipelineStepId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deletePipelineStep(pipelineStepId) {
  const payload = await apiRequest(`/api/talent-acquisition/planning/pipeline/${pipelineStepId}`, {
    method: 'DELETE',
    body: {},
  });
  return payload.data;
}

export async function createScorecardCriterion(body) {
  const payload = await apiRequest('/api/talent-acquisition/planning/scorecard', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updateScorecardCriterion(scorecardCriterionId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/planning/scorecard/${scorecardCriterionId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deleteScorecardCriterion(scorecardCriterionId) {
  const payload = await apiRequest(`/api/talent-acquisition/planning/scorecard/${scorecardCriterionId}`, {
    method: 'DELETE',
    body: {},
  });
  return payload.data;
}
