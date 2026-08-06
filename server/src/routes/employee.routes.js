const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../middleware/rbac.middleware');
const {
  createEmployeeController,
  deleteEmployeeController,
  getEmployeeController,
  listEmployeesController,
  updateEmployeeController,
  updateEmployeeStatusController,
} = require('../controllers/employee.controller');

const router = express.Router();

router.use(requireAuth, ensurePasswordChanged);

router.get('/', requirePermissions(['user.read']), asyncHandler(listEmployeesController));
router.get('/:employeeId', requirePermissions(['user.read']), asyncHandler(getEmployeeController));
router.post('/', requirePermissions(['user.create']), asyncHandler(createEmployeeController));
router.patch('/:employeeId', requirePermissions(['user.update']), asyncHandler(updateEmployeeController));
router.patch('/:employeeId/status', requirePermissions(['user.suspend']), asyncHandler(updateEmployeeStatusController));
router.delete('/:employeeId', requirePermissions(['user.update']), asyncHandler(deleteEmployeeController));

module.exports = router;
