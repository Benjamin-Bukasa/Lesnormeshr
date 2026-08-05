const { UserStatus } = require('@prisma/client');

const {
  createUser,
  getAccessOptions,
  listUsers,
  updateUserAccess,
  updateUserStatus,
} = require('../services/auth.service');

async function createUserController(req, res) {
  const result = await createUser(req.body, {
    id: req.auth.user.id,
    tenantId: req.auth.tenantId,
    role: req.auth.access.role,
    permissions: req.auth.access.permissions,
  });

  res.status(201).json(result);
}

async function listUsersController(req, res) {
  const result = await listUsers({
    ...req.query,
    tenantId: req.auth.tenantId,
  });
  res.status(200).json({ users: result.items, pagination: result.pagination });
}

async function accessOptionsController(req, res) {
  const result = await getAccessOptions();
  res.status(200).json(result);
}

async function updateUserAccessController(req, res) {
  const result = await updateUserAccess(req.params.userId, req.body, {
    id: req.auth.user.id,
    tenantId: req.auth.tenantId,
    role: req.auth.access.role,
    permissions: req.auth.access.permissions,
  });

  res.status(200).json(result);
}

async function updateUserStatusController(req, res) {
  const normalizedStatus = String(req.body.status || '').toUpperCase();
  const status = UserStatus[normalizedStatus];
  const result = await updateUserStatus(req.params.userId, status, {
    tenantId: req.auth.tenantId,
  });

  res.status(200).json(result);
}

module.exports = {
  accessOptionsController,
  createUserController,
  listUsersController,
  updateUserAccessController,
  updateUserStatusController,
};
