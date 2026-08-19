const {
  clearCompletedWorkspaceTasks,
  getWorkspaceSummary,
  markMessagesRead,
  markNotificationsRead,
  updateWorkspaceTask,
} = require('../services/workspace.service');

async function getWorkspaceSummaryController(req, res) {
  const data = await getWorkspaceSummary({
    userId: req.auth.user.id,
    tenantId: req.auth.tenantId,
  });

  res.status(200).json(data);
}

async function updateWorkspaceTaskController(req, res) {
  const task = await updateWorkspaceTask(req.params.taskId, req.body, {
    userId: req.auth.user.id,
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ task });
}

async function clearCompletedWorkspaceTasksController(req, res) {
  await clearCompletedWorkspaceTasks({
    userId: req.auth.user.id,
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ message: 'Taches terminees nettoyees.' });
}

async function markNotificationsReadController(req, res) {
  await markNotificationsRead({
    userId: req.auth.user.id,
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ message: 'Notifications marquees comme lues.' });
}

async function markMessagesReadController(req, res) {
  await markMessagesRead({
    userId: req.auth.user.id,
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ message: 'Messages marques comme lus.' });
}

module.exports = {
  clearCompletedWorkspaceTasksController,
  getWorkspaceSummaryController,
  markMessagesReadController,
  markNotificationsReadController,
  updateWorkspaceTaskController,
};
