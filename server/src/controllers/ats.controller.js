const {
  createAtsApplicationIntake,
  getCandidateResumeProfile,
  getApplicationScreeningDetail,
  listApplicationScreenings,
  listJobScorecards,
  parseCandidateResume,
  runApplicationScreening,
  saveJobScorecard,
  updateApplicationAtsDecision,
} = require('../services/ats.service');

async function createAtsApplicationIntakeController(req, res) {
  const data = await createAtsApplicationIntake(req.body, req.auth.user.id, req.auth.tenantId, req.file || null);
  res.status(201).json({ message: 'Candidature ATS creee et analysee.', data });
}

async function listJobScorecardsController(req, res) {
  const result = await listJobScorecards(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function saveJobScorecardController(req, res) {
  const data = await saveJobScorecard(req.params.jobPostingId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Scorecard ATS enregistree.', data });
}

async function parseCandidateResumeController(req, res) {
  const data = await parseCandidateResume(req.params.candidateId, req.auth.tenantId);
  res.status(200).json({ message: 'CV parse et profil structure mis a jour.', data });
}

async function getCandidateResumeProfileController(req, res) {
  const data = await getCandidateResumeProfile(req.params.candidateId, req.auth.tenantId);
  res.status(200).json({ data });
}

async function listApplicationScreeningsController(req, res) {
  const result = await listApplicationScreenings(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function runApplicationScreeningController(req, res) {
  const data = await runApplicationScreening(req.params.applicationId, req.auth.tenantId);
  res.status(200).json({ message: 'Screening ATS calcule.', data });
}

async function getApplicationScreeningDetailController(req, res) {
  const data = await getApplicationScreeningDetail(req.params.applicationId, req.auth.tenantId);
  res.status(200).json({ data });
}

async function updateApplicationAtsDecisionController(req, res) {
  const data = await updateApplicationAtsDecision(req.params.applicationId, req.body, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Decision recruteur enregistree.', data });
}

module.exports = {
  createAtsApplicationIntakeController,
  getApplicationScreeningDetailController,
  getCandidateResumeProfileController,
  listApplicationScreeningsController,
  listJobScorecardsController,
  parseCandidateResumeController,
  runApplicationScreeningController,
  saveJobScorecardController,
  updateApplicationAtsDecisionController,
};
