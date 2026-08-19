const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../middleware/rbac.middleware');
const {
  createEmployeeController,
  deleteEmployeeController,
  deleteEmployeeDocumentController,
  getEmployeeController,
  listEmployeeDocumentsByEmployeeController,
  listEmployeeDocumentsController,
  listEmployeesController,
  updateEmployeeController,
  updateEmployeeStatusController,
  uploadEmployeeAvatarController,
  uploadEmployeeDocumentController,
  verifyEmployeeDocumentController,
} = require('../controllers/employee.controller');
const { employeeAvatarUpload, employeeDocumentUpload } = require('../middleware/upload.middleware');

const router = express.Router();

router.use(requireAuth, ensurePasswordChanged);

router.get('/', requirePermissions(['user.read']), asyncHandler(listEmployeesController));
router.get('/documents', requirePermissions(['user.read']), asyncHandler(listEmployeeDocumentsController));
router.post('/documents', requirePermissions(['user.update']), employeeDocumentUpload.single('file'), asyncHandler(uploadEmployeeDocumentController));
router.post('/:employeeId/documents', requirePermissions(['user.update']), employeeDocumentUpload.single('file'), asyncHandler(uploadEmployeeDocumentController));
router.patch('/documents/:documentId/verify', requirePermissions(['user.update']), asyncHandler(verifyEmployeeDocumentController));
router.delete('/documents/:documentId', requirePermissions(['user.update']), asyncHandler(deleteEmployeeDocumentController));
router.get('/:employeeId/documents', requirePermissions(['user.read']), asyncHandler(listEmployeeDocumentsByEmployeeController));
router.get('/:employeeId', requirePermissions(['user.read']), asyncHandler(getEmployeeController));
router.post('/', requirePermissions(['user.create']), asyncHandler(createEmployeeController));
router.patch('/:employeeId', requirePermissions(['user.update']), asyncHandler(updateEmployeeController));
router.patch('/:employeeId/status', requirePermissions(['user.suspend']), asyncHandler(updateEmployeeStatusController));
router.patch('/:employeeId/avatar', requirePermissions(['user.update']), employeeAvatarUpload.single('file'), asyncHandler(uploadEmployeeAvatarController));
router.delete('/:employeeId', requirePermissions(['user.update']), asyncHandler(deleteEmployeeController));

module.exports = router;
