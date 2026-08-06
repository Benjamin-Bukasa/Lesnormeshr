const AppError = require('../utils/app-error');

function hasMatch(grantedValues, expectedValues, match = 'all') {
  if (!expectedValues.length) {
    return true;
  }

  if (match === 'any') {
    return expectedValues.some((value) => grantedValues.includes(value));
  }

  return expectedValues.every((value) => grantedValues.includes(value));
}

function requireRoles(expectedRoles, match = 'any') {
  return function roleGuard(req, res, next) {
    const roleCode = req.auth?.access?.role?.code;
    const grantedRoles = roleCode ? [roleCode] : [];

    if (!hasMatch(grantedRoles, expectedRoles, match)) {
      next(new AppError(403, 'Role insuffisant pour acceder a cette ressource.'));
      return;
    }

    next();
  };
}

function requirePermissions(expectedPermissions, match = 'all') {
  return function permissionGuard(req, res, next) {
    const grantedPermissions = req.auth?.access?.permissions || [];

    if (!hasMatch(grantedPermissions, expectedPermissions, match)) {
      next(new AppError(403, 'Permissions insuffisantes pour acceder a cette ressource.'));
      return;
    }

    next();
  };
}

function requireModules(expectedModules, match = 'all') {
  return function moduleGuard(req, res, next) {
    const grantedModules = req.auth?.access?.modules || [];

    if (!hasMatch(grantedModules, expectedModules, match)) {
      next(new AppError(403, 'Module non accessible pour cet utilisateur.'));
      return;
    }

    next();
  };
}

module.exports = {
  requireModules,
  requirePermissions,
  requireRoles,
};
