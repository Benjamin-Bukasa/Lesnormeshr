const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { profileAvatarUpload } = require('../middleware/upload.middleware');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const { requirePermissions, requireRoles } = require('../middleware/rbac.middleware');
const {
  accessOptionsController,
  createDepartmentController,
  createUserController,
  deleteUserController,
  deleteDepartmentController,
  listDepartmentsController,
  listUsersController,
  updateDepartmentController,
  updateUserAccessController,
  updateUserAvatarController,
  updateUserProfileController,
  updateUserStatusController,
} = require('../controllers/admin.controller');

const router = express.Router();

router.use(requireAuth, ensurePasswordChanged);

router.get(
  '/access/options',
  requirePermissions(['role.read', 'permission.read', 'module.read'], 'any'),
  asyncHandler(accessOptionsController),
);

router.get('/users', requirePermissions(['user.read']), asyncHandler(listUsersController));
router.post('/users', requirePermissions(['user.create', 'role.assign']), asyncHandler(createUserController));
router.delete('/users/:userId', requirePermissions(['user.update']), asyncHandler(deleteUserController));
router.patch('/users/:userId', requirePermissions(['user.update']), asyncHandler(updateUserProfileController));
router.patch('/users/:userId/avatar', requirePermissions(['user.update']), profileAvatarUpload.single('file'), asyncHandler(updateUserAvatarController));
router.patch('/users/:userId/access', requirePermissions(['user.update']), asyncHandler(updateUserAccessController));
router.patch('/users/:userId/status', requirePermissions(['user.suspend']), asyncHandler(updateUserStatusController));

router.get('/departments', requirePermissions(['module.read']), asyncHandler(listDepartmentsController));
router.post('/departments', requirePermissions(['module.assign']), asyncHandler(createDepartmentController));
router.patch('/departments/:departmentId', requirePermissions(['module.assign']), asyncHandler(updateDepartmentController));
router.delete('/departments/:departmentId', requirePermissions(['module.assign']), asyncHandler(deleteDepartmentController));

router.get(
  '/super-admin/ping',
  requireRoles(['SUPER_ADMIN']),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Zone super admin accessible.' });
  }),
);

module.exports = router;
