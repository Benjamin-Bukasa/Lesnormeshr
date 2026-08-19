const fs = require('fs');
const path = require('path');

const { DeliveryChannel, ResetPurpose, UserStatus } = require('@prisma/client');

const env = require('../config/env');
const { getCookieOptions } = require('../config/cookies');
const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');
const { buildPagination, parsePagination } = require('../utils/pagination');
const { profileUploadDirectory } = require('../middleware/upload.middleware');
const { hashPassword, verifyPassword, generateTemporaryPassword, validatePasswordStrength } = require('../utils/password');
const { generateOpaqueToken, hashOpaqueToken, generateOtpCode } = require('../utils/tokens');
const { getClientIp } = require('../utils/request');
const { authUserProfileSelect, sanitizeUser, buildAccessPayload } = require('./access.service');
const { sendTemporaryPassword, sendPasswordResetCode } = require('./brevo.service');

const loginUserSelect = {
  ...authUserProfileSelect,
  passwordHash: true,
  failedLoginCount: true,
  lockedUntil: true,
};

function normalizeEmail(email) {
  return email ? String(email).trim().toLowerCase() : null;
}

function normalizePhone(phone) {
  return phone ? String(phone).trim() : null;
}

function normalizeDateOfBirth(value) {
  if (value === undefined) return undefined;
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date > new Date()) {
    throw new AppError(400, 'Date de naissance invalide.');
  }

  return date;
}

function resolveDeliveryChannel(user, preferredChannel) {
  const requested = preferredChannel ? String(preferredChannel).toUpperCase() : null;

  if (requested === DeliveryChannel.SMS && user.phone) {
    return DeliveryChannel.SMS;
  }

  if (requested === DeliveryChannel.EMAIL && user.email) {
    return DeliveryChannel.EMAIL;
  }

  if (user.preferredChannel === DeliveryChannel.SMS && user.phone) {
    return DeliveryChannel.SMS;
  }

  if (user.email) {
    return DeliveryChannel.EMAIL;
  }

  if (user.phone) {
    return DeliveryChannel.SMS;
  }

  throw new AppError(400, 'Aucun canal de livraison valide n est disponible pour cet utilisateur.');
}

function ensurePreferredChannel(value) {
  const normalized = String(value || '').toUpperCase();

  if (!DeliveryChannel[normalized]) {
    throw new AppError(400, `Canal invalide: ${value}`);
  }

  return DeliveryChannel[normalized];
}

function getDebugSecretPayload(secretName, secretValue) {
  if (!env.exposeDebugSecrets) {
    return {};
  }

  return {
    [secretName]: secretValue,
  };
}

function getSessionCookieValue(req) {
  return req.cookies?.[env.cookieName] || null;
}

function removeStoredProfileAvatar(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/profiles/')) {
    return;
  }

  const filename = path.basename(avatarUrl);
  const absolutePath = path.join(profileUploadDirectory, filename);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

async function resolveDefaultTenant() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: env.defaultTenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new AppError(500, 'Tenant par defaut introuvable. Lance le seed Prisma.');
  }

  return tenant;
}

async function createSession(req, res, user) {
  const rawToken = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.sessionIdleTimeoutMs);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      tokenHash,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      lastActivityAt: now,
      expiresAt,
    },
  });

  res.cookie(env.cookieName, rawToken, getCookieOptions());

  return session;
}

function clearSessionCookie(res) {
  res.clearCookie(env.cookieName, {
    ...getCookieOptions(),
    maxAge: undefined,
  });
}

async function revokeCurrentSession(req, res) {
  const rawToken = getSessionCookieValue(req);

  if (!rawToken) {
    clearSessionCookie(res);
    return;
  }

  await prisma.session.updateMany({
    where: {
      tokenHash: hashOpaqueToken(rawToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  clearSessionCookie(res);
}

async function findUserByIdentifier(identifier) {
  const email = normalizeEmail(identifier);
  const phone = normalizePhone(identifier);
  const clauses = [];

  if (email) {
    clauses.push({ email });
  }

  if (phone) {
    clauses.push({ phone });
  }

  if (!clauses.length) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: clauses,
    },
    select: loginUserSelect,
  });
}

async function register(req, res, payload) {
  if (!env.allowSelfRegistration) {
    throw new AppError(403, "L'inscription libre est desactivee.");
  }

  const { firstName, lastName, email, phone, password, preferredChannel } = payload;

  if (!firstName || !lastName || !password) {
    throw new AppError(400, 'firstName, lastName et password sont obligatoires.');
  }

  if (!email && !phone) {
    throw new AppError(400, 'Un email ou un numero de telephone est obligatoire.');
  }

  const passwordValidation = validatePasswordStrength(password);

  if (!passwordValidation.isValid) {
    throw new AppError(400, 'Mot de passe trop faible.', passwordValidation.errors);
  }

  const employeeRole = await prisma.role.findUnique({
    where: { code: 'EMPLOYEE' },
  });
  const defaultTenant = await resolveDefaultTenant();

  if (!employeeRole) {
    throw new AppError(500, 'Le role EMPLOYEE est introuvable. Lance le seed Prisma.');
  }

  const now = new Date();
  const createdUser = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizeEmail(email),
      phone: normalizePhone(phone),
      tenantId: defaultTenant.id,
      passwordHash: await hashPassword(password),
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      preferredChannel: preferredChannel === DeliveryChannel.SMS ? DeliveryChannel.SMS : DeliveryChannel.EMAIL,
      roleId: employeeRole.id,
      firstLoginAt: now,
      lastLoginAt: now,
    },
    select: authUserProfileSelect,
  });

  const session = await createSession(req, res, createdUser);

  return {
    message: 'Inscription reussie.',
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
    user: sanitizeUser(createdUser),
  };
}

async function login(req, res, payload) {
  const { identifier, password } = payload;

  if (!identifier || !password) {
    throw new AppError(400, 'identifier et password sont obligatoires.');
  }

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw new AppError(401, 'Identifiants invalides.');
  }

  const now = new Date();

  if (user.lockedUntil && user.lockedUntil > now) {
    throw new AppError(423, "Le compte est temporairement verrouille suite a plusieurs echecs.");
  }

  if ([UserStatus.SUSPENDED, UserStatus.ARCHIVED].includes(user.status)) {
    throw new AppError(403, 'Ce compte ne peut pas se connecter.');
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    const nextFailedCount = user.failedLoginCount + 1;
    const shouldLock = nextFailedCount >= 5;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : nextFailedCount,
        lockedUntil: shouldLock ? new Date(now.getTime() + 15 * 60 * 1000) : null,
        status: shouldLock ? UserStatus.LOCKED : user.status,
      },
    });

    throw new AppError(401, 'Identifiants invalides.');
  }

  const effectiveStatus = user.status === UserStatus.INVITED || user.status === UserStatus.LOCKED
    ? UserStatus.ACTIVE
    : user.status;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      status: effectiveStatus,
      lastLoginAt: now,
    },
  });

  const session = await createSession(req, res, user);

  return {
    message: 'Connexion reussie.',
    requiresPasswordChange: user.mustChangePassword,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
    user: sanitizeUser({
      ...user,
      failedLoginCount: 0,
      lockedUntil: null,
      status: effectiveStatus,
      lastLoginAt: now,
    }),
  };
}

async function changePassword(userId, payload) {
  const { currentPassword, newPassword } = payload;

  if (!currentPassword || !newPassword) {
    throw new AppError(400, 'currentPassword et newPassword sont obligatoires.');
  }

  const passwordValidation = validatePasswordStrength(newPassword);

  if (!passwordValidation.isValid) {
    throw new AppError(400, 'Mot de passe trop faible.', passwordValidation.errors);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'Utilisateur introuvable.');
  }

  const passwordMatches = await verifyPassword(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(400, 'Le mot de passe actuel est incorrect.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
      firstLoginAt: user.firstLoginAt || new Date(),
      status: UserStatus.ACTIVE,
      lockedUntil: null,
      failedLoginCount: 0,
    },
  });

  return {
    message: 'Mot de passe modifie avec succes.',
  };
}

async function updateCurrentProfile(userId, tenantId, payload) {
  const firstName = payload.firstName !== undefined ? String(payload.firstName || '').trim() : undefined;
  const lastName = payload.lastName !== undefined ? String(payload.lastName || '').trim() : undefined;
  const email = payload.email !== undefined ? normalizeEmail(payload.email) : undefined;
  const phone = payload.phone !== undefined ? normalizePhone(payload.phone) : undefined;
  const preferredChannel = payload.preferredChannel !== undefined
    ? ensurePreferredChannel(payload.preferredChannel)
    : undefined;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: authUserProfileSelect,
  });

  if (!user) {
    throw new AppError(404, 'Utilisateur introuvable.');
  }

  const nextEmail = email !== undefined ? email : user.email;
  const nextPhone = phone !== undefined ? phone : user.phone;
  const nextPreferredChannel = preferredChannel || user.preferredChannel;

  if (!nextEmail && !nextPhone) {
    throw new AppError(400, 'Un email ou un numero de telephone est obligatoire.');
  }

  if (!firstName && payload.firstName !== undefined) {
    throw new AppError(400, 'firstName est obligatoire.');
  }

  if (!lastName && payload.lastName !== undefined) {
    throw new AppError(400, 'lastName est obligatoire.');
  }

  if (nextPreferredChannel === DeliveryChannel.SMS && !nextPhone) {
    throw new AppError(400, 'Un numero de telephone est requis pour le canal SMS.');
  }

  if (nextPreferredChannel === DeliveryChannel.EMAIL && !nextEmail) {
    throw new AppError(400, 'Un email est requis pour le canal EMAIL.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: firstName !== undefined ? firstName : undefined,
      lastName: lastName !== undefined ? lastName : undefined,
      email,
      phone,
      preferredChannel,
    },
    select: authUserProfileSelect,
  });

  return {
    message: 'Profil mis a jour avec succes.',
    user: sanitizeUser(updatedUser),
    access: buildAccessPayload(updatedUser),
  };
}

async function updateCurrentProfileAvatar(userId, tenantId, file) {
  if (!file) {
    throw new AppError(400, 'Fichier image requis.');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: authUserProfileSelect,
  });

  if (!user) {
    throw new AppError(404, 'Utilisateur introuvable.');
  }

  const avatarUrl = `/uploads/profiles/${file.filename}`;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      avatarUrl,
    },
    select: authUserProfileSelect,
  });

  if (user.avatarUrl && user.avatarUrl !== avatarUrl) {
    removeStoredProfileAvatar(user.avatarUrl);
  }

  return {
    message: 'Photo de profil mise a jour avec succes.',
    user: sanitizeUser(updatedUser),
    access: buildAccessPayload(updatedUser),
  };
}

async function updateUserProfile(userId, payload, actor) {
  const firstName = payload.firstName !== undefined ? String(payload.firstName || '').trim() : undefined;
  const lastName = payload.lastName !== undefined ? String(payload.lastName || '').trim() : undefined;
  const email = payload.email !== undefined ? normalizeEmail(payload.email) : undefined;
  const phone = payload.phone !== undefined ? normalizePhone(payload.phone) : undefined;
  const dateOfBirth = normalizeDateOfBirth(payload.dateOfBirth);

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: actor?.tenantId },
    select: authUserProfileSelect,
  });

  if (!user) throw new AppError(404, 'Utilisateur introuvable.');
  if (!firstName && payload.firstName !== undefined) throw new AppError(400, 'firstName est obligatoire.');
  if (!lastName && payload.lastName !== undefined) throw new AppError(400, 'lastName est obligatoire.');
  if (!(email !== undefined ? email : user.email) && !(phone !== undefined ? phone : user.phone)) {
    throw new AppError(400, 'Un email ou un numero de telephone est obligatoire.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, email, phone, dateOfBirth },
    select: authUserProfileSelect,
  });

  return { message: 'Informations utilisateur mises a jour.', user: sanitizeUser(updatedUser) };
}

async function updateUserAvatar(userId, file, actor) {
  if (!file) throw new AppError(400, 'Fichier image requis.');

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: actor?.tenantId },
    select: authUserProfileSelect,
  });
  if (!user) throw new AppError(404, 'Utilisateur introuvable.');

  const avatarUrl = `/uploads/profiles/${file.filename}`;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: authUserProfileSelect,
  });

  if (user.avatarUrl && user.avatarUrl !== avatarUrl) removeStoredProfileAvatar(user.avatarUrl);
  return { message: 'Photo de profil mise a jour.', user: sanitizeUser(updatedUser) };
}

async function requestPasswordReset(payload) {
  const { identifier, channel } = payload;

  if (!identifier) {
    throw new AppError(400, 'identifier est obligatoire.');
  }

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    return {
      message: 'Si un compte existe, un code de reinitialisation sera envoye.',
    };
  }

  const deliveryChannel = resolveDeliveryChannel(user, channel);
  const code = generateOtpCode(6);

  await prisma.passwordReset.updateMany({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    data: {
      consumedAt: new Date(),
    },
  });

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      channel: deliveryChannel,
      purpose: ResetPurpose.FORGOT_PASSWORD,
      codeHash: hashOpaqueToken(code),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const deliveryResult = await sendPasswordResetCode({
    user,
    code,
    channel: deliveryChannel,
  });

  return {
    message: 'Si un compte existe, un code de reinitialisation sera envoye.',
    channel: deliveryChannel,
    delivery: deliveryResult,
    ...getDebugSecretPayload('resetCode', code),
  };
}

async function resetPassword(payload) {
  const { identifier, code, newPassword } = payload;

  if (!identifier || !code || !newPassword) {
    throw new AppError(400, 'identifier, code et newPassword sont obligatoires.');
  }

  const passwordValidation = validatePasswordStrength(newPassword);

  if (!passwordValidation.isValid) {
    throw new AppError(400, 'Mot de passe trop faible.', passwordValidation.errors);
  }

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw new AppError(400, 'Code de reinitialisation invalide.');
  }

  const resetRequest = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!resetRequest || resetRequest.codeHash !== hashOpaqueToken(code)) {
    throw new AppError(400, 'Code de reinitialisation invalide ou expire.');
  }

  const newPasswordHash = await hashPassword(newPassword);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordReset.update({
      where: { id: resetRequest.id },
      data: {
        consumedAt: now,
      },
    }),
    prisma.session.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    }),
  ]);

  return {
    message: 'Mot de passe reinitialise avec succes.',
  };
}

async function createUser(payload, actor) {
  const { firstName, lastName, email, phone, roleCode, permissionCodes = [], moduleCodes = [], preferredChannel } = payload;
  const actorPermissions = actor?.permissions || [];

  if (!firstName || !lastName || !roleCode) {
    throw new AppError(400, 'firstName, lastName et roleCode sont obligatoires.');
  }

  if (!email && !phone) {
    throw new AppError(400, 'Un email ou un numero de telephone est obligatoire.');
  }

  if (!actor?.tenantId) {
    throw new AppError(400, 'Tenant de l utilisateur createur introuvable.');
  }

  const role = await prisma.role.findUnique({
    where: { code: roleCode },
  });

  if (!role) {
    throw new AppError(400, `Role introuvable: ${roleCode}`);
  }

  if (role.code === 'SUPER_ADMIN' && actor?.role?.code !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Seul un super admin peut creer un autre super admin.');
  }

  if (permissionCodes.length && !actorPermissions.includes('permission.assign')) {
    throw new AppError(403, 'Permission insuffisante pour attribuer des permissions directes.');
  }

  if (moduleCodes.length && !actorPermissions.includes('module.assign')) {
    throw new AppError(403, 'Permission insuffisante pour attribuer des modules.');
  }

  const permissions = permissionCodes.length
    ? await prisma.permission.findMany({ where: { code: { in: permissionCodes } } })
    : [];
  const modules = moduleCodes.length
    ? await prisma.appModule.findMany({ where: { code: { in: moduleCodes } } })
    : [];

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const createdUser = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizeEmail(email),
      phone: normalizePhone(phone),
      tenantId: actor.tenantId,
      passwordHash,
      status: UserStatus.INVITED,
      mustChangePassword: true,
      preferredChannel: preferredChannel === DeliveryChannel.SMS ? DeliveryChannel.SMS : DeliveryChannel.EMAIL,
      roleId: role.id,
      createdById: actor?.id || null,
      permissions: permissions.length
        ? {
            create: permissions.map((permission) => ({
              permissionId: permission.id,
            })),
          }
        : undefined,
      modules: modules.length
        ? {
            create: modules.map((moduleItem) => ({
              moduleId: moduleItem.id,
            })),
          }
        : undefined,
    },
    select: authUserProfileSelect,
  });

  // Les identifiants doivent parvenir par email dès qu'une adresse est disponible.
  // Le SMS reste un repli uniquement pour les comptes sans email.
  const deliveryChannel = createdUser.email
    ? DeliveryChannel.EMAIL
    : resolveDeliveryChannel(createdUser, preferredChannel);
  const deliveryResult = await sendTemporaryPassword({
    user: createdUser,
    temporaryPassword,
    channel: deliveryChannel,
  });

  return {
    message: 'Utilisateur cree avec succes.',
    delivery: {
      channel: deliveryChannel,
      ...deliveryResult,
    },
    user: sanitizeUser(createdUser),
    // Secret a usage unique: renvoye uniquement dans la reponse de creation,
    // jamais stocke en clair en base de donnees.
    temporaryPassword,
  };
}

async function deleteUser(userId, actor) {
  if (!actor?.tenantId) {
    throw new AppError(400, 'Tenant de l utilisateur connecte introuvable.');
  }

  if (userId === actor.id) {
    throw new AppError(400, 'Vous ne pouvez pas supprimer votre propre compte.');
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: actor.tenantId,
    },
    select: {
      id: true,
      role: {
        select: { code: true },
      },
    },
  });

  if (!targetUser) {
    throw new AppError(404, 'Utilisateur introuvable.');
  }

  if (targetUser.role.code === 'SUPER_ADMIN') {
    if (actor?.role?.code !== 'SUPER_ADMIN') {
      throw new AppError(403, 'Seul un super admin peut supprimer un super admin.');
    }

    const superAdminCount = await prisma.user.count({
      where: {
        tenantId: actor.tenantId,
        role: { code: 'SUPER_ADMIN' },
      },
    });

    if (superAdminCount <= 1) {
      throw new AppError(409, 'Le dernier super admin du tenant ne peut pas etre supprime.');
    }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    if (error?.code === 'P2003') {
      throw new AppError(409, 'Cet utilisateur possede deja des donnees metier. Suspendez ou archivez plutot son compte.');
    }
    throw error;
  }

  return {
    message: 'Utilisateur supprime avec succes.',
  };
}

async function updateUserAccess(userId, payload, actor) {
  const actorPermissions = actor?.permissions || [];
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: actor?.tenantId,
    },
    select: authUserProfileSelect,
  });

  if (!targetUser) {
    throw new AppError(404, 'Utilisateur introuvable.');
  }

  const nextRole = payload.roleCode
    ? await prisma.role.findUnique({ where: { code: payload.roleCode } })
    : targetUser.role;

  if (!nextRole) {
    throw new AppError(400, 'Role demande introuvable.');
  }

  if (nextRole.code === 'SUPER_ADMIN' && actor?.role?.code !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Seul un super admin peut attribuer le role SUPER_ADMIN.');
  }

  if (payload.roleCode && !actorPermissions.includes('role.assign')) {
    throw new AppError(403, 'Permission insuffisante pour changer un role.');
  }

  if (payload.permissionCodes && !actorPermissions.includes('permission.assign')) {
    throw new AppError(403, 'Permission insuffisante pour modifier les permissions directes.');
  }

  if (payload.moduleCodes && !actorPermissions.includes('module.assign')) {
    throw new AppError(403, 'Permission insuffisante pour modifier les modules.');
  }

  const permissions = payload.permissionCodes
    ? await prisma.permission.findMany({ where: { code: { in: payload.permissionCodes } } })
    : null;
  const modules = payload.moduleCodes
    ? await prisma.appModule.findMany({ where: { code: { in: payload.moduleCodes } } })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        roleId: nextRole.id,
      },
    });

    if (permissions) {
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      if (permissions.length) {
        await tx.userPermission.createMany({
          data: permissions.map((permission) => ({
            userId,
            permissionId: permission.id,
          })),
        });
      }
    }

    if (modules) {
      await tx.userModuleAccess.deleteMany({
        where: { userId },
      });

      if (modules.length) {
        await tx.userModuleAccess.createMany({
          data: modules.map((moduleItem) => ({
            userId,
            moduleId: moduleItem.id,
          })),
        });
      }
    }
  });

  const refreshedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: authUserProfileSelect,
  });

  return {
    message: 'Acces utilisateur mis a jour.',
    user: sanitizeUser(refreshedUser),
  };
}

async function updateUserStatus(userId, status, actor) {
  const allowedStatuses = [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.ARCHIVED];

  if (!allowedStatuses.includes(status)) {
    throw new AppError(400, 'Statut non autorise.');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: actor?.tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'Utilisateur introuvable.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      lockedUntil: status === UserStatus.ACTIVE ? null : undefined,
    },
    select: authUserProfileSelect,
  });

  if (status !== UserStatus.ACTIVE) {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  return {
    message: 'Statut utilisateur mis a jour.',
    user: sanitizeUser(updatedUser),
  };
}

async function listUsers(params = {}) {
  if (!params.tenantId) {
    throw new AppError(400, 'tenantId est obligatoire.');
  }

  const { page, limit, skip, take } = parsePagination(params);
  const [totalItems, users] = await Promise.all([
    prisma.user.count({
      where: {
        tenantId: params.tenantId,
      },
    }),
    prisma.user.findMany({
      where: {
        tenantId: params.tenantId,
      },
      skip,
      take,
      select: authUserProfileSelect,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    items: users.map(sanitizeUser),
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function getAccessOptions() {
  const [roles, permissions, modules] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: 'asc' } }),
    prisma.permission.findMany({ orderBy: { name: 'asc' } }),
    prisma.appModule.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return {
    roles,
    permissions,
    modules,
  };
}

async function getCurrentAuthState(userId, tenantId) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: authUserProfileSelect,
  });

  if (!user) {
    throw new AppError(404, 'Utilisateur introuvable.');
  }

  return {
    user: sanitizeUser(user),
    access: buildAccessPayload(user),
  };
}

module.exports = {
  buildAccessPayload,
  clearSessionCookie,
  createSession,
  createUser,
  deleteUser,
  getAccessOptions,
  getCurrentAuthState,
  getSessionCookieValue,
  listUsers,
  login,
  register,
  requestPasswordReset,
  resetPassword,
  revokeCurrentSession,
  updateCurrentProfile,
  updateCurrentProfileAvatar,
  updateUserAvatar,
  updateUserProfile,
  updateUserAccess,
  updateUserStatus,
  changePassword,
};
