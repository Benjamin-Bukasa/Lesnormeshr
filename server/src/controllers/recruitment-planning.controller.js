const {
  createPipelineStep,
  createScorecardCriterion,
  createWeeklyPlan,
  deletePipelineStep,
  deleteScorecardCriterion,
  deleteWeeklyPlan,
  listRecruitmentPlanningData,
  listRecruitmentPlanningHistory,
  updatePipelineStep,
  updateScorecardCriterion,
  updateWeeklyPlan,
} = require('../services/recruitment-planning.service');

async function getRecruitmentPlanningController(req, res) {
  const data = await listRecruitmentPlanningData(req.auth.tenantId);
  res.status(200).json({ data });
}

async function getRecruitmentPlanningHistoryController(req, res) {
  const data = await listRecruitmentPlanningHistory(req.query, req.auth.tenantId);
  res.status(200).json({ data });
}

async function createWeeklyPlanController(req, res) {
  const data = await createWeeklyPlan(req.body, req.auth.user.id, req.auth.tenantId);
  res.status(201).json({ message: 'Planning hebdomadaire cree.', data });
}

async function updateWeeklyPlanController(req, res) {
  const data = await updateWeeklyPlan(req.params.weeklyPlanId, req.body, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Planning hebdomadaire mis a jour.', data });
}

async function deleteWeeklyPlanController(req, res) {
  const data = await deleteWeeklyPlan(req.params.weeklyPlanId, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Planning hebdomadaire supprime.', data });
}

async function createPipelineStepController(req, res) {
  const data = await createPipelineStep(req.body, req.auth.user.id, req.auth.tenantId);
  res.status(201).json({ message: 'Etape pipeline creee.', data });
}

async function updatePipelineStepController(req, res) {
  const data = await updatePipelineStep(req.params.pipelineStepId, req.body, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Etape pipeline mise a jour.', data });
}

async function deletePipelineStepController(req, res) {
  const data = await deletePipelineStep(req.params.pipelineStepId, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Etape pipeline supprimee.', data });
}

async function createScorecardCriterionController(req, res) {
  const data = await createScorecardCriterion(req.body, req.auth.user.id, req.auth.tenantId);
  res.status(201).json({ message: 'Critere scorecard cree.', data });
}

async function updateScorecardCriterionController(req, res) {
  const data = await updateScorecardCriterion(req.params.scorecardCriterionId, req.body, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Critere scorecard mis a jour.', data });
}

async function deleteScorecardCriterionController(req, res) {
  const data = await deleteScorecardCriterion(req.params.scorecardCriterionId, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ message: 'Critere scorecard supprime.', data });
}

module.exports = {
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
};
