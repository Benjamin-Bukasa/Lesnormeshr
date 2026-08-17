const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const {
  clearCompletedWorkspaceTasksController,
  getWorkspaceSummaryController,
  markMessagesReadController,
  markNotificationsReadController,
  updateWorkspaceTaskController,
} = require('../controllers/workspace.controller');

const router = express.Router();

router.use(requireAuth, ensurePasswordChanged);

router.get('/summary', asyncHandler(getWorkspaceSummaryController));
router.patch('/tasks/:taskId', asyncHandler(updateWorkspaceTaskController));
router.delete('/tasks/completed', asyncHandler(clearCompletedWorkspaceTasksController));
router.post('/notifications/read', asyncHandler(markNotificationsReadController));
router.post('/messages/read', asyncHandler(markMessagesReadController));

module.exports = router;
