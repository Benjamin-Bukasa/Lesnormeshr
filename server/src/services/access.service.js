function dedupe(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

const accessPermissionSelect = {
  permission: {
    select: {
      code: true,
    },
  },
};

const accessModuleSelect = {
  module: {
    select: {
      code: true,
    },
  },
};

const roleAccessSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  permissions: {
    select: accessPermissionSelect,
  },
  modules: {
    select: accessModuleSelect,
  },
};

const authUserAccessSelect = {
  role: {
    select: roleAccessSelect,
  },
  permissions: {
    select: accessPermissionSelect,
  },
  modules: {
    select: accessModuleSelect,
  },
};

const authUserProfileSelect = {
  id: true,
  tenantId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  status: true,
  mustChangePassword: true,
  preferredChannel: true,
  firstLoginAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  tenant: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  },
  ...authUserAccessSelect,
};

function buildAccessPayload(user) {
  const rolePermissions = user.role?.permissions?.map((item) => item.permission.code) || [];
  const directPermissions = user.permissions?.map((item) => item.permission.code) || [];
  const roleModules = user.role?.modules?.map((item) => item.module.code) || [];
  const directModules = user.modules?.map((item) => item.module.code) || [];

  return {
    role: user.role
      ? {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
          description: user.role.description,
        }
      : null,
    permissions: dedupe([...rolePermissions, ...directPermissions]),
    modules: dedupe([...roleModules, ...directModules]),
  };
}

function sanitizeUser(user) {
  const access = buildAccessPayload(user);

  return {
    id: user.id,
    tenantId: user.tenantId,
    tenant: user.tenant || null,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl || '',
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    preferredChannel: user.preferredChannel,
    firstLoginAt: user.firstLoginAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    access,
  };
}

module.exports = {
  authUserAccessSelect,
  authUserProfileSelect,
  buildAccessPayload,
  roleAccessSelect,
  sanitizeUser,
};
