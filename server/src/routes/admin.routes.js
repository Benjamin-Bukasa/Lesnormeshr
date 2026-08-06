const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const { requirePermissions, requireRoles } = require('../middleware/rbac.middleware');
const {
  accessOptionsController,
  createUserController,
  listUsersController,
  updateUserAccessController,
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
router.patch('/users/:userId/access', requirePermissions(['user.update']), asyncHandler(updateUserAccessController));
router.patch('/users/:userId/status', requirePermissions(['user.suspend']), asyncHandler(updateUserStatusController));

router.get(
  '/super-admin/ping',
  requireRoles(['SUPER_ADMIN']),
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Zone super admin accessible.' });
  }),
);

module.exports = router;
