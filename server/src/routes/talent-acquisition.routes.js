const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const { requireModules, requirePermissions } = require('../middleware/rbac.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
  addOnboardingTaskController,
  createApplicationController,
  createCandidateController,
  deleteCandidateController,
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
} = require('../controllers/talent-acquisition.controller');
const {
  createAtsApplicationIntakeController,
  getApplicationScreeningDetailController,
  getCandidateResumeProfileController,
  listApplicationScreeningsController,
  listJobScorecardsController,
  parseCandidateResumeController,
  runApplicationScreeningController,
  saveJobScorecardController,
  updateApplicationAtsDecisionController,
} = require('../controllers/ats.controller');
const {
  createPipelineStepController,
  createScorecardCriterionController,
  createWeeklyPlanController,
  deletePipelineStepController,
  deleteScorecardCriterionController,
  deleteWeeklyPlanController,
  getRecruitmentPlanningController,
  getRecruitmentPlanningHistoryController,
  updatePipelineStepController,
  updateScorecardCriterionController,
  updateWeeklyPlanController,
} = require('../controllers/recruitment-planning.controller');

const router = express.Router();

router.use(requireAuth, ensurePasswordChanged, requireModules(['TALENT_ACQUISITION']));

router.get('/dashboard', requirePermissions(['talent.dashboard.read']), asyncHandler(getTalentDashboardController));

router.get('/planning', requirePermissions(['talent.request.read']), asyncHandler(getRecruitmentPlanningController));
router.get('/planning/history', requirePermissions(['talent.request.read']), asyncHandler(getRecruitmentPlanningHistoryController));
router.post('/planning/weekly', requirePermissions(['talent.request.create']), asyncHandler(createWeeklyPlanController));
router.patch('/planning/weekly/:weeklyPlanId', requirePermissions(['talent.request.update']), asyncHandler(updateWeeklyPlanController));
router.delete('/planning/weekly/:weeklyPlanId', requirePermissions(['talent.request.update']), asyncHandler(deleteWeeklyPlanController));
router.post('/planning/pipeline', requirePermissions(['talent.request.create']), asyncHandler(createPipelineStepController));
router.patch('/planning/pipeline/:pipelineStepId', requirePermissions(['talent.request.update']), asyncHandler(updatePipelineStepController));
router.delete('/planning/pipeline/:pipelineStepId', requirePermissions(['talent.request.update']), asyncHandler(deletePipelineStepController));
router.post('/planning/scorecard', requirePermissions(['talent.request.create']), asyncHandler(createScorecardCriterionController));
router.patch('/planning/scorecard/:scorecardCriterionId', requirePermissions(['talent.request.update']), asyncHandler(updateScorecardCriterionController));
router.delete('/planning/scorecard/:scorecardCriterionId', requirePermissions(['talent.request.update']), asyncHandler(deleteScorecardCriterionController));

router.get('/recruitment-requests', requirePermissions(['talent.request.read']), asyncHandler(listRecruitmentRequestsController));
router.post('/recruitment-requests', requirePermissions(['talent.request.create']), asyncHandler(createRecruitmentRequestController));
router.patch('/recruitment-requests/:requestId/status', requirePermissions(['talent.request.update']), asyncHandler(updateRecruitmentRequestStatusController));

router.get('/job-postings', requirePermissions(['talent.job.read']), asyncHandler(listJobPostingsController));
router.post('/job-postings', requirePermissions(['talent.job.create']), asyncHandler(createJobPostingController));
router.patch('/job-postings/:jobPostingId', requirePermissions(['talent.job.update']), asyncHandler(updateJobPostingController));

router.get('/candidates', requirePermissions(['talent.candidate.read']), asyncHandler(listCandidatesController));
router.post('/candidates', requirePermissions(['talent.candidate.create']), asyncHandler(createCandidateController));
router.patch('/candidates/:candidateId', requirePermissions(['talent.candidate.update']), asyncHandler(updateCandidateController));
router.delete('/candidates/:candidateId', requirePermissions(['talent.candidate.update']), asyncHandler(deleteCandidateController));

router.get('/applications', requirePermissions(['talent.application.read']), asyncHandler(listApplicationsController));
router.post('/applications', requirePermissions(['talent.application.create']), asyncHandler(createApplicationController));
router.patch('/applications/:applicationId/stage', requirePermissions(['talent.application.update']), asyncHandler(updateApplicationStageController));
router.patch('/applications/:applicationId/kanban-position', requirePermissions(['talent.application.update']), asyncHandler(moveApplicationKanbanPositionController));

router.get('/interviews', requirePermissions(['talent.interview.read']), asyncHandler(listInterviewsController));
router.post('/interviews', requirePermissions(['talent.interview.create']), asyncHandler(scheduleInterviewController));
router.patch('/interviews/:interviewId', requirePermissions(['talent.interview.update']), asyncHandler(updateInterviewController));

router.get('/offers', requirePermissions(['talent.offer.read']), asyncHandler(listOffersController));
router.post('/offers', requirePermissions(['talent.offer.create']), asyncHandler(createOfferController));
router.patch('/offers/:offerId/status', requirePermissions(['talent.offer.update']), asyncHandler(updateOfferStatusController));

router.get('/onboarding-plans', requirePermissions(['talent.onboarding.read']), asyncHandler(listOnboardingPlansController));
router.post('/onboarding-plans', requirePermissions(['talent.onboarding.create']), asyncHandler(createOnboardingPlanController));
router.post('/onboarding-plans/:planId/tasks', requirePermissions(['talent.onboarding.update']), asyncHandler(addOnboardingTaskController));
router.patch('/onboarding-tasks/:taskId/status', requirePermissions(['talent.onboarding.update']), asyncHandler(updateOnboardingTaskStatusController));

router.get('/documents', requirePermissions(['talent.document.read']), asyncHandler(listTalentDocumentsController));
router.post('/documents/upload', requirePermissions(['talent.document.create']), upload.single('file'), asyncHandler(uploadTalentDocumentController));

router.post('/ats/intake', requirePermissions(['talent.candidate.create', 'talent.application.create']), upload.single('file'), asyncHandler(createAtsApplicationIntakeController));
router.get('/ats/job-postings/:jobPostingId/scorecards', requirePermissions(['talent.job.read']), asyncHandler(listJobScorecardsController));
router.put('/ats/job-postings/:jobPostingId/scorecards/default', requirePermissions(['talent.job.update']), asyncHandler(saveJobScorecardController));
router.post('/ats/candidates/:candidateId/parse-resume', requirePermissions(['talent.candidate.update']), asyncHandler(parseCandidateResumeController));
router.get('/ats/candidates/:candidateId/resume-profile', requirePermissions(['talent.candidate.read']), asyncHandler(getCandidateResumeProfileController));
router.get('/ats/screenings', requirePermissions(['talent.application.read']), asyncHandler(listApplicationScreeningsController));
router.post('/ats/applications/:applicationId/screening', requirePermissions(['talent.application.update']), asyncHandler(runApplicationScreeningController));
router.get('/ats/applications/:applicationId/screening', requirePermissions(['talent.application.read']), asyncHandler(getApplicationScreeningDetailController));
router.patch('/ats/applications/:applicationId/decision', requirePermissions(['talent.application.update']), asyncHandler(updateApplicationAtsDecisionController));

module.exports = router;
