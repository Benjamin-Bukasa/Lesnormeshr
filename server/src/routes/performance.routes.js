const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const { requireModules, requirePermissions } = require('../middleware/rbac.middleware');
const {
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
  listKpiAssignmentsController,
  listKpiCheckInsController,
  listKpiDefinitionsController,
  listCyclesController,
  listFeedbacksController,
  listGoalsController,
  listReviewsController,
  listTrainingsController,
  updateCycleController,
  updateGoalController,
  updateKpiAssignmentController,
  updateKpiCheckInController,
  updateKpiDefinitionController,
  updateReviewController,
  updateTrainingController,
} = require('../controllers/performance.controller');

const router = express.Router();

router.use(requireAuth, ensurePasswordChanged, requireModules(['PERFORMANCE_360']));

router.get('/dashboard', requirePermissions(['performance.dashboard.read']), asyncHandler(getPerformanceDashboardController));
router.get('/options', requirePermissions(['performance.options.read']), asyncHandler(getPerformanceOptionsController));

router.get('/cycles', requirePermissions(['performance.cycle.read']), asyncHandler(listCyclesController));
router.post('/cycles', requirePermissions(['performance.cycle.create']), asyncHandler(createCycleController));
router.patch('/cycles/:cycleId', requirePermissions(['performance.cycle.update']), asyncHandler(updateCycleController));
router.delete('/cycles/:cycleId', requirePermissions(['performance.cycle.update']), asyncHandler(deleteCycleController));

router.get('/goals', requirePermissions(['performance.goal.read']), asyncHandler(listGoalsController));
router.post('/goals', requirePermissions(['performance.goal.create']), asyncHandler(createGoalController));
router.patch('/goals/:goalId', requirePermissions(['performance.goal.update']), asyncHandler(updateGoalController));
router.delete('/goals/:goalId', requirePermissions(['performance.goal.update']), asyncHandler(deleteGoalController));

router.get('/kpis', requirePermissions(['performance.goal.read']), asyncHandler(listKpiDefinitionsController));
router.post('/kpis', requirePermissions(['performance.goal.create']), asyncHandler(createKpiDefinitionController));
router.patch('/kpis/:kpiDefinitionId', requirePermissions(['performance.goal.update']), asyncHandler(updateKpiDefinitionController));
router.delete('/kpis/:kpiDefinitionId', requirePermissions(['performance.goal.update']), asyncHandler(deleteKpiDefinitionController));

router.get('/kpi-assignments', requirePermissions(['performance.goal.read']), asyncHandler(listKpiAssignmentsController));
router.post('/kpi-assignments', requirePermissions(['performance.goal.create']), asyncHandler(createKpiAssignmentController));
router.patch('/kpi-assignments/:assignmentId', requirePermissions(['performance.goal.update']), asyncHandler(updateKpiAssignmentController));
router.delete('/kpi-assignments/:assignmentId', requirePermissions(['performance.goal.update']), asyncHandler(deleteKpiAssignmentController));

router.get('/check-ins', requirePermissions(['performance.goal.read']), asyncHandler(listKpiCheckInsController));
router.post('/check-ins', requirePermissions(['performance.goal.create']), asyncHandler(createKpiCheckInController));
router.patch('/check-ins/:checkInId', requirePermissions(['performance.goal.update']), asyncHandler(updateKpiCheckInController));
router.delete('/check-ins/:checkInId', requirePermissions(['performance.goal.update']), asyncHandler(deleteKpiCheckInController));

router.get('/reviews', requirePermissions(['performance.review.read']), asyncHandler(listReviewsController));
router.post('/reviews', requirePermissions(['performance.review.create']), asyncHandler(createReviewController));
router.patch('/reviews/:reviewId', requirePermissions(['performance.review.update']), asyncHandler(updateReviewController));
router.delete('/reviews/:reviewId', requirePermissions(['performance.review.update']), asyncHandler(deleteReviewController));

router.get('/feedbacks', requirePermissions(['performance.feedback.read']), asyncHandler(listFeedbacksController));
router.post('/feedbacks', requirePermissions(['performance.feedback.create']), asyncHandler(createFeedbackController));

router.get('/trainings', requirePermissions(['performance.training.read']), asyncHandler(listTrainingsController));
router.post('/trainings', requirePermissions(['performance.training.create']), asyncHandler(createTrainingController));
router.patch('/trainings/:trainingId', requirePermissions(['performance.training.update']), asyncHandler(updateTrainingController));
router.delete('/trainings/:trainingId', requirePermissions(['performance.training.update']), asyncHandler(deleteTrainingController));

module.exports = router;
