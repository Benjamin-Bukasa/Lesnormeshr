const {
  createCycle,
  createFeedback,
  createGoal,
  createKpiAssignment,
  createKpiCheckIn,
  createKpiDefinition,
  createReview,
  createTraining,
  deleteCycle,
  deleteGoal,
  deleteKpiAssignment,
  deleteKpiCheckIn,
  deleteKpiDefinition,
  deleteReview,
  deleteTraining,
  getPerformanceDashboard,
  getPerformanceOptions,
  listKpiAssignments,
  listKpiCheckIns,
  listKpiDefinitions,
  listCycles,
  listFeedbacks,
  listGoals,
  listReviews,
  listTrainings,
  updateCycle,
  updateGoal,
  updateKpiAssignment,
  updateKpiCheckIn,
  updateKpiDefinition,
  updateReview,
  updateTraining,
} = require('../services/performance.service');

async function getPerformanceDashboardController(req, res) {
  const data = await getPerformanceDashboard(req.auth.tenantId);
  res.status(200).json({ data });
}

async function getPerformanceOptionsController(req, res) {
  const data = await getPerformanceOptions(req.auth.tenantId);
  res.status(200).json({ data });
}

async function listCyclesController(req, res) {
  const result = await listCycles(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createCycleController(req, res) {
  const data = await createCycle(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Campagne de performance creee.', data });
}

async function updateCycleController(req, res) {
  const data = await updateCycle(req.params.cycleId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Campagne de performance mise a jour.', data });
}

async function deleteCycleController(req, res) {
  const data = await deleteCycle(req.params.cycleId, req.auth.tenantId);
  res.status(200).json({ message: 'Campagne de performance supprimee.', data });
}

async function listGoalsController(req, res) {
  const result = await listGoals(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function listKpiDefinitionsController(req, res) {
  const result = await listKpiDefinitions(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createKpiDefinitionController(req, res) {
  const data = await createKpiDefinition(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'KPI cree.', data });
}

async function updateKpiDefinitionController(req, res) {
  const data = await updateKpiDefinition(req.params.kpiDefinitionId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'KPI mis a jour.', data });
}

async function deleteKpiDefinitionController(req, res) {
  const data = await deleteKpiDefinition(req.params.kpiDefinitionId, req.auth.tenantId);
  res.status(200).json({ message: 'KPI supprime.', data });
}

async function listKpiAssignmentsController(req, res) {
  const result = await listKpiAssignments(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createKpiAssignmentController(req, res) {
  const data = await createKpiAssignment(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Affectation KPI creee.', data });
}

async function updateKpiAssignmentController(req, res) {
  const data = await updateKpiAssignment(req.params.assignmentId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Affectation KPI mise a jour.', data });
}

async function deleteKpiAssignmentController(req, res) {
  const data = await deleteKpiAssignment(req.params.assignmentId, req.auth.tenantId);
  res.status(200).json({ message: 'Affectation KPI supprimee.', data });
}

async function listKpiCheckInsController(req, res) {
  const result = await listKpiCheckIns(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createKpiCheckInController(req, res) {
  const data = await createKpiCheckIn(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Check-in KPI cree.', data });
}

async function updateKpiCheckInController(req, res) {
  const data = await updateKpiCheckIn(req.params.checkInId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Check-in KPI mis a jour.', data });
}

async function deleteKpiCheckInController(req, res) {
  const data = await deleteKpiCheckIn(req.params.checkInId, req.auth.tenantId);
  res.status(200).json({ message: 'Check-in KPI supprime.', data });
}

async function createGoalController(req, res) {
  const data = await createGoal(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Objectif de performance cree.', data });
}

async function updateGoalController(req, res) {
  const data = await updateGoal(req.params.goalId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Objectif de performance mis a jour.', data });
}

async function deleteGoalController(req, res) {
  const data = await deleteGoal(req.params.goalId, req.auth.tenantId);
  res.status(200).json({ message: 'Objectif de performance supprime.', data });
}

async function listReviewsController(req, res) {
  const result = await listReviews(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createReviewController(req, res) {
  const data = await createReview(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Evaluation de performance creee.', data });
}

async function updateReviewController(req, res) {
  const data = await updateReview(req.params.reviewId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Evaluation de performance mise a jour.', data });
}

async function deleteReviewController(req, res) {
  const data = await deleteReview(req.params.reviewId, req.auth.tenantId);
  res.status(200).json({ message: 'Evaluation de performance supprimee.', data });
}

async function listFeedbacksController(req, res) {
  const result = await listFeedbacks(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createFeedbackController(req, res) {
  const data = await createFeedback(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Feedback de performance cree.', data });
}

async function listTrainingsController(req, res) {
  const result = await listTrainings(req.query, req.auth.tenantId);
  res.status(200).json({ data: result.items, pagination: result.pagination });
}

async function createTrainingController(req, res) {
  const data = await createTraining(req.body, req.auth.tenantId);
  res.status(201).json({ message: 'Action de developpement creee.', data });
}

async function updateTrainingController(req, res) {
  const data = await updateTraining(req.params.trainingId, req.body, req.auth.tenantId);
  res.status(200).json({ message: 'Action de developpement mise a jour.', data });
}

async function deleteTrainingController(req, res) {
  const data = await deleteTraining(req.params.trainingId, req.auth.tenantId);
  res.status(200).json({ message: 'Action de developpement supprimee.', data });
}

module.exports = {
  createCycleController,
  createFeedbackController,
  createGoalController,
  createKpiAssignmentController,
  createKpiCheckInController,
  createKpiDefinitionController,
  createReviewController,
  createTrainingController,
  deleteCycleController,
  deleteGoalController,
  deleteKpiAssignmentController,
  deleteKpiCheckInController,
  deleteKpiDefinitionController,
  deleteReviewController,
  deleteTrainingController,
  getPerformanceDashboardController,
  getPerformanceOptionsController,
  listCyclesController,
  listFeedbacksController,
  listGoalsController,
  listKpiAssignmentsController,
  listKpiCheckInsController,
  listKpiDefinitionsController,
  listReviewsController,
  listTrainingsController,
  updateCycleController,
  updateGoalController,
  updateKpiAssignmentController,
  updateKpiCheckInController,
  updateKpiDefinitionController,
  updateReviewController,
  updateTrainingController,
};
