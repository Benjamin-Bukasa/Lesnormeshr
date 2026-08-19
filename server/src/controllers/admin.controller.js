const { UserStatus } = require('@prisma/client');

const {
  createUser,
  deleteUser,
  getAccessOptions,
  listUsers,
  updateUserAccess,
  updateUserAvatar,
  updateUserProfile,
  updateUserStatus,
} = require('../services/auth.service');
const {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} = require('../services/department.service');

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

async function deleteUserController(req, res) {
  const result = await deleteUser(req.params.userId, {
    id: req.auth.user.id,
    tenantId: req.auth.tenantId,
    role: req.auth.access.role,
  });

  res.status(200).json(result);
}

async function accessOptionsController(req, res) {
  const result = await getAccessOptions();
  res.status(200).json(result);
}

async function listDepartmentsController(req, res) {
  const departments = await listDepartments();
  res.status(200).json({ departments });
}

async function createDepartmentController(req, res) {
  const department = await createDepartment(req.body);
  res.status(201).json({ department });
}

async function updateDepartmentController(req, res) {
  const department = await updateDepartment(req.params.departmentId, req.body);
  res.status(200).json({ department });
}

async function deleteDepartmentController(req, res) {
  await deleteDepartment(req.params.departmentId);
  res.status(200).json({ message: 'Departement supprime.' });
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

async function updateUserProfileController(req, res) {
  const result = await updateUserProfile(req.params.userId, req.body, {
    id: req.auth.user.id,
    tenantId: req.auth.tenantId,
  });
  res.status(200).json(result);
}

async function updateUserAvatarController(req, res) {
  const result = await updateUserAvatar(req.params.userId, req.file, {
    id: req.auth.user.id,
    tenantId: req.auth.tenantId,
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
};
