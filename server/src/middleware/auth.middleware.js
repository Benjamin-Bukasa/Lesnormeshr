const { UserStatus } = require('@prisma/client');

const env = require('../config/env');
const { getCookieOptions } = require('../config/cookies');
const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');
const { hashOpaqueToken } = require('../utils/tokens');
const { authUserAccessSelect, buildAccessPayload } = require('../services/access.service');
const { clearSessionCookie } = require('../services/auth.service');

const sessionSelect = {
  id: true,
  tenantId: true,
  expiresAt: true,
  lastActivityAt: true,
  revokedAt: true,
  user: {
    select: {
      id: true,
      tenantId: true,
      status: true,
      mustChangePassword: true,
      ...authUserAccessSelect,
    },
  },
};

async function requireAuth(req, res, next) {
  try {
    const rawToken = req.cookies?.[env.cookieName];

    if (!rawToken) {
      throw new AppError(401, 'Authentification requise.');
    }

    const session = await prisma.session.findUnique({
      where: {
        tokenHash: hashOpaqueToken(rawToken),
      },
      select: sessionSelect,
    });

    if (!session || session.revokedAt) {
      clearSessionCookie(res);
      throw new AppError(401, 'Session invalide ou expiree.');
    }

    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    const lastActivityAt = new Date(session.lastActivityAt).getTime();
    const inactiveTooLong = now - lastActivityAt > env.sessionIdleTimeoutMs;

    if (inactiveTooLong || expiresAt <= now) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
        },
      });

      clearSessionCookie(res);
      throw new AppError(401, 'Session expiree apres 1h d inactivite.');
    }

    if ([UserStatus.SUSPENDED, UserStatus.ARCHIVED].includes(session.user.status)) {
      clearSessionCookie(res);
      throw new AppError(403, 'Ce compte est suspendu.');
    }

    const shouldTouch = now - lastActivityAt >= env.sessionTouchIntervalMs;

    if (shouldTouch) {
      const nextExpiresAt = new Date(now + env.sessionIdleTimeoutMs);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          lastActivityAt: new Date(now),
          expiresAt: nextExpiresAt,
        },
      });

      res.cookie(env.cookieName, rawToken, {
        ...getCookieOptions(),
        expires: nextExpiresAt,
      });
    }

    req.session = session;
    req.auth = {
      sessionId: session.id,
      tenantId: session.user.tenantId,
      user: session.user,
      access: buildAccessPayload(session.user),
    };

    next();
  } catch (error) {
    next(error);
  }
}

function ensurePasswordChanged(req, res, next) {
  if (!req.auth?.user?.mustChangePassword) {
    next();
    return;
  }

  next(new AppError(403, 'Changement du mot de passe obligatoire avant d acceder a cette ressource.'));
}

module.exports = {
  requireAuth,
  ensurePasswordChanged,
};
