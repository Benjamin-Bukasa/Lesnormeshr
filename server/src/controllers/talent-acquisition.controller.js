const {
  addOnboardingTask,
  createApplication,
  createCandidate,
  createJobPosting,
  createOffer,
  createOnboardingPlan,
  createRecruitmentRequest,
  getTalentDashboard,
  listApplications,
  listCandidates,
  listTalentDocuments,
  listInterviews,
  listJobPostings,
  moveApplicationKanbanPosition,
  listOffers,
  listOnboardingPlans,
  listRecruitmentRequests,
  scheduleInterview,
  updateCandidate,
  updateInterview,
  updateJobPosting,
  updateApplicationStage,
  updateOfferStatus,
  updateOnboardingTaskStatus,
  updateRecruitmentRequestStatus,
  uploadTalentDocument,
} = require('../services/talent-acquisition.service');

async function listRecruitmentRequestsController(req, res) {
  const result = await listRecruitmentRequests(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createRecruitmentRequestController(req, res) {
  const data = await createRecruitmentRequest(req.body, req.auth.user.id, req.auth.tenantId);
  res.status(201).json({ message: 'Demande de recrutement creee.', data });
}

async function updateRecruitmentRequestStatusController(req, res) {
  const data = await updateRecruitmentRequestStatus(req.params.requestId, req.body, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Statut de la demande mis a jour.', data });
}

async function listJobPostingsController(req, res) {
  const result = await listJobPostings(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createJobPostingController(req, res) {
  const data = await createJobPosting(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Offre de recrutement creee.', data });
}

async function updateJobPostingController(req, res) {
  const data = await updateJobPosting(req.params.jobPostingId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Offre de recrutement mise a jour.', data });
}

async function listCandidatesController(req, res) {
  const result = await listCandidates(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createCandidateController(req, res) {
  const data = await createCandidate(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Candidat cree.', data });
}

async function updateCandidateController(req, res) {
  const data = await updateCandidate(req.params.candidateId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Candidat mis a jour.', data });
}

async function listApplicationsController(req, res) {
  const result = await listApplications(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createApplicationController(req, res) {
  const data = await createApplication(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Candidature creee.', data });
}

async function updateApplicationStageController(req, res) {
  const data = await updateApplicationStage(req.params.applicationId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Pipeline candidature mis a jour.', data });
}

async function moveApplicationKanbanPositionController(req, res) {
  const data = await moveApplicationKanbanPosition(req.params.applicationId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Position kanban mise a jour.', data });
}

async function listInterviewsController(req, res) {
  const result = await listInterviews(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function scheduleInterviewController(req, res) {
  const data = await scheduleInterview(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Entretien planifie.', data });
}

async function updateInterviewController(req, res) {
  const data = await updateInterview(req.params.interviewId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Entretien mis a jour.', data });
}

async function listOffersController(req, res) {
  const result = await listOffers(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createOfferController(req, res) {
  const data = await createOffer(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Offre d embauche creee.', data });
}

async function updateOfferStatusController(req, res) {
  const data = await updateOfferStatus(req.params.offerId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Statut de l offre mis a jour.', data });
}

async function listOnboardingPlansController(req, res) {
  const result = await listOnboardingPlans(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createOnboardingPlanController(req, res) {
  const data = await createOnboardingPlan(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Plan d onboarding cree.', data });
}

async function addOnboardingTaskController(req, res) {
  const data = await addOnboardingTask(req.params.planId, req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Tache d onboarding creee.', data });
}

async function updateOnboardingTaskStatusController(req, res) {
  const data = await updateOnboardingTaskStatus(req.params.taskId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Statut de la tache mis a jour.', data });
}

async function getTalentDashboardController(req, res) {
  const data = await getTalentDashboard(req.auth.tenantId);
  res.status(200).json({ data });
}

async function listTalentDocumentsController(req, res) {
  const result = await listTalentDocuments(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function uploadTalentDocumentController(req, res) {
  const data = await uploadTalentDocument({
    file: req.file,
    ownerType: req.body.ownerType,
    ownerId: req.body.ownerId,
    title: req.body.title,
    category: req.body.category,
  }, req.auth.user.id, req.auth.tenantId);

  res.status(201).json({ message: 'Document televerse.', data });
}

module.exports = {
  addOnboardingTaskController,
  createApplicationController,
  createCandidateController,
  createJobPostingController,
  createOfferController,
  createOnboardingPlanController,
  createRecruitmentRequestController,
  getTalentDashboardController,
  listApplicationsController,
  listCandidatesController,
  listTalentDocumentsController,
  listInterviewsController,
  listJobPostingsController,
  moveApplicationKanbanPositionController,
  listOffersController,
  listOnboardingPlansController,
  listRecruitmentRequestsController,
  scheduleInterviewController,
  updateCandidateController,
  updateInterviewController,
  updateJobPostingController,
  updateApplicationStageController,
  updateOfferStatusController,
  updateOnboardingTaskStatusController,
  updateRecruitmentRequestStatusController,
  uploadTalentDocumentController,
};
