const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function apiRequest(path, { method = 'GET', body, headers } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: isFormData ? headers : {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body === undefined ? undefined : (isFormData ? body : JSON.stringify(body)),
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

async function listCollection(path, params = {}) {
  const payload = await apiRequest(`${path}${buildQuery({ page: 1, limit: 100, ...params })}`);
  return {
    items: payload.data || [],
    pagination: payload.pagination || null,
  };
}

export function talentStatusTone(status) {
  const normalized = String(status || '').toUpperCase();

  if (['ACTIVE', 'PUBLISHED', 'APPROVED', 'HIRED', 'COMPLETED', 'DONE', 'ACCEPTED'].includes(normalized)) return 'success';
  if (['IN_PROGRESS', 'SCREENING', 'TEST', 'OFFER', 'NOT_STARTED', 'SCHEDULED', 'SUBMITTED'].includes(normalized)) return 'info';
  if (['PAUSED', 'DRAFT', 'TODO'].includes(normalized)) return 'neutral';
  if (['REJECTED', 'CANCELLED', 'BLOCKED', 'ARCHIVED', 'CLOSED', 'EXPIRED', 'NO_SHOW', 'WITHDRAWN'].includes(normalized)) return 'danger';
  return 'warning';
}

export async function listRecruitmentRequests(params = {}) {
  return listCollection('/api/talent-acquisition/recruitment-requests', params);
}

export async function createRecruitmentRequest(body) {
  const payload = await apiRequest('/api/talent-acquisition/recruitment-requests', { method: 'POST', body });
  return payload.data;
}

export async function updateRecruitmentRequestStatus(requestId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/recruitment-requests/${requestId}/status`, { method: 'PATCH', body });
  return payload.data;
}

export async function listJobPostings(params = {}) {
  return listCollection('/api/talent-acquisition/job-postings', params);
}

export async function createJobPosting(body) {
  const payload = await apiRequest('/api/talent-acquisition/job-postings', { method: 'POST', body });
  return payload.data;
}

export async function updateJobPosting(jobPostingId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/job-postings/${jobPostingId}`, { method: 'PATCH', body });
  return payload.data;
}

export async function listCandidates(params = {}) {
  return listCollection('/api/talent-acquisition/candidates', params);
}

export async function createCandidate(body) {
  const payload = await apiRequest('/api/talent-acquisition/candidates', { method: 'POST', body });
  return payload.data;
}

export async function updateCandidate(candidateId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/candidates/${candidateId}`, { method: 'PATCH', body });
  return payload.data;
}

export async function deleteCandidate(candidateId) {
  const payload = await apiRequest(`/api/talent-acquisition/candidates/${candidateId}`, { method: 'DELETE' });
  return payload.data;
}

export async function listApplications(params = {}) {
  return listCollection('/api/talent-acquisition/applications', params);
}

export async function createApplication(body) {
  const payload = await apiRequest('/api/talent-acquisition/applications', { method: 'POST', body });
  return payload.data;
}

export async function updateApplicationStage(applicationId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/applications/${applicationId}/stage`, { method: 'PATCH', body });
  return payload.data;
}

export async function moveApplicationKanbanPosition(applicationId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/applications/${applicationId}/kanban-position`, { method: 'PATCH', body });
  return payload.data;
}

export async function listInterviews(params = {}) {
  return listCollection('/api/talent-acquisition/interviews', params);
}

export async function scheduleInterview(body) {
  const payload = await apiRequest('/api/talent-acquisition/interviews', { method: 'POST', body });
  return payload.data;
}

export async function updateInterview(interviewId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/interviews/${interviewId}`, { method: 'PATCH', body });
  return payload.data;
}

export async function listOffers(params = {}) {
  return listCollection('/api/talent-acquisition/offers', params);
}

export async function createOffer(body) {
  const payload = await apiRequest('/api/talent-acquisition/offers', { method: 'POST', body });
  return payload.data;
}

export async function updateOfferStatus(offerId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/offers/${offerId}/status`, { method: 'PATCH', body });
  return payload.data;
}

export async function listOnboardingPlans(params = {}) {
  return listCollection('/api/talent-acquisition/onboarding-plans', params);
}

export async function createOnboardingPlan(body) {
  const payload = await apiRequest('/api/talent-acquisition/onboarding-plans', { method: 'POST', body });
  return payload.data;
}

export async function addOnboardingTask(planId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/onboarding-plans/${planId}/tasks`, { method: 'POST', body });
  return payload.data;
}

export async function updateOnboardingTaskStatus(taskId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/onboarding-tasks/${taskId}/status`, { method: 'PATCH', body });
  return payload.data;
}

export async function createAtsApplicationIntake(body) {
  const payload = await apiRequest('/api/talent-acquisition/ats/intake', { method: 'POST', body });
  return payload.data;
}

export async function listJobScorecards(jobPostingId, params = {}) {
  return listCollection(`/api/talent-acquisition/ats/job-postings/${jobPostingId}/scorecards`, params);
}

export async function saveDefaultJobScorecard(jobPostingId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/ats/job-postings/${jobPostingId}/scorecards/default`, { method: 'PUT', body });
  return payload.data;
}

export async function parseCandidateResumeProfile(candidateId) {
  const payload = await apiRequest(`/api/talent-acquisition/ats/candidates/${candidateId}/parse-resume`, { method: 'POST' });
  return payload.data;
}

export async function getCandidateResumeProfile(candidateId) {
  const payload = await apiRequest(`/api/talent-acquisition/ats/candidates/${candidateId}/resume-profile`);
  return payload.data;
}

export async function listAtsScreenings(params = {}) {
  return listCollection('/api/talent-acquisition/ats/screenings', params);
}

export async function runAtsScreening(applicationId) {
  const payload = await apiRequest(`/api/talent-acquisition/ats/applications/${applicationId}/screening`, { method: 'POST' });
  return payload.data;
}

export async function getAtsScreeningDetail(applicationId) {
  const payload = await apiRequest(`/api/talent-acquisition/ats/applications/${applicationId}/screening`);
  return payload.data;
}

export async function updateAtsDecision(applicationId, body) {
  const payload = await apiRequest(`/api/talent-acquisition/ats/applications/${applicationId}/decision`, { method: 'PATCH', body });
  return payload.data;
}
