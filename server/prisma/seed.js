require('dotenv').config();

const env = require('../src/config/env');
const { PrismaClient, DeliveryChannel, UserStatus } = require('@prisma/client');
const { APP_MODULES, PERMISSIONS, SYSTEM_ROLES } = require('../src/constants/access-control');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function ensureDefaultTenant() {
  return prisma.tenant.upsert({
    where: { slug: env.defaultTenantSlug },
    update: {
      name: env.defaultTenantName,
      status: 'ACTIVE',
    },
    create: {
      name: env.defaultTenantName,
      slug: env.defaultTenantSlug,
      status: 'ACTIVE',
    },
  });
}

async function upsertModules() {
  for (const moduleItem of APP_MODULES) {
    await prisma.appModule.upsert({
      where: { code: moduleItem.code },
      update: {
        name: moduleItem.name,
        description: moduleItem.description,
      },
      create: moduleItem,
    });
  }
}

async function upsertPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
      },
      create: permission,
    });
  }
}

async function upsertRoles() {
  const permissionMap = new Map((await prisma.permission.findMany()).map((item) => [item.code, item]));
  const moduleMap = new Map((await prisma.appModule.findMany()).map((item) => [item.code, item]));

  for (const roleDefinition of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleDefinition.code },
      update: {
        name: roleDefinition.name,
        description: roleDefinition.description,
      },
      create: {
        code: roleDefinition.code,
        name: roleDefinition.name,
        description: roleDefinition.description,
      },
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    if (roleDefinition.permissionCodes.length) {
      await prisma.rolePermission.createMany({
        data: roleDefinition.permissionCodes.map((permissionCode) => ({
          roleId: role.id,
          permissionId: permissionMap.get(permissionCode).id,
        })),
      });
    }

    await prisma.roleModuleAccess.deleteMany({
      where: { roleId: role.id },
    });

    if (roleDefinition.moduleCodes.length) {
      await prisma.roleModuleAccess.createMany({
        data: roleDefinition.moduleCodes.map((moduleCode) => ({
          roleId: role.id,
          moduleId: moduleMap.get(moduleCode).id,
        })),
      });
    }
  }
}

async function ensureSuperAdmin() {
  if (!env.superAdminEmail && !env.superAdminPhone) {
    console.log('Aucun super admin cree: SUPER_ADMIN_EMAIL ou SUPER_ADMIN_PHONE manquant.');
    return;
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });
  const defaultTenant = await ensureDefaultTenant();

  if (!superAdminRole) {
    throw new Error('Le role SUPER_ADMIN est introuvable.');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        env.superAdminEmail ? { email: env.superAdminEmail.toLowerCase() } : undefined,
        env.superAdminPhone ? { phone: env.superAdminPhone } : undefined,
      ].filter(Boolean),
    },
  });

  if (existingUser) {
    if (existingUser.roleId !== superAdminRole.id) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          tenantId: existingUser.tenantId || defaultTenant.id,
          roleId: superAdminRole.id,
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
          preferredChannel: env.superAdminPhone ? DeliveryChannel.SMS : DeliveryChannel.EMAIL,
        },
      });

      console.log('Utilisateur existant promu en super admin.');
      return prisma.user.findUnique({ where: { id: existingUser.id } });
    }

    console.log('Le super admin existe deja.');
    return existingUser;
  }

  const password = env.superAdminPassword || 'ChangeMe123!';

  const createdUser = await prisma.user.create({
    data: {
      firstName: 'Super',
      lastName: 'Admin',
      email: env.superAdminEmail ? env.superAdminEmail.toLowerCase() : null,
      phone: env.superAdminPhone || null,
      tenantId: defaultTenant.id,
      passwordHash: await hashPassword(password),
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      preferredChannel: env.superAdminPhone ? DeliveryChannel.SMS : DeliveryChannel.EMAIL,
      roleId: superAdminRole.id,
      firstLoginAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  console.log(`Super admin cree: ${env.superAdminEmail || env.superAdminPhone}`);
  return createdUser;
}

async function ensureWorkspaceSeedData(user) {
  if (!user) return;

  const [taskCount, notificationCount, messageCount] = await Promise.all([
    prisma.workspaceTask.count({ where: { tenantId: user.tenantId, assigneeId: user.id } }),
    prisma.userNotification.count({ where: { tenantId: user.tenantId, userId: user.id } }),
    prisma.userMessage.count({ where: { tenantId: user.tenantId, recipientId: user.id } }),
  ]);

  const today = new Date();
  const todayAt = (hour) => {
    const date = new Date(today);
    date.setHours(hour, 0, 0, 0);
    return date;
  };
  const tomorrowAt = (hour) => {
    const date = todayAt(hour);
    date.setDate(date.getDate() + 1);
    return date;
  };

  if (taskCount === 0) {
    await prisma.workspaceTask.createMany({
      data: [
        {
          tenantId: user.tenantId,
          assigneeId: user.id,
          createdById: user.id,
          title: 'Completer le questionnaire avant la session Leadership Track',
          category: 'Developpement des employes',
          dueAt: todayAt(11),
        },
        {
          tenantId: user.tenantId,
          assigneeId: user.id,
          createdById: user.id,
          title: "Finaliser les retours du panel d'entretien pour le poste Produit",
          category: 'Acquisition des talents',
          dueAt: todayAt(15),
        },
        {
          tenantId: user.tenantId,
          assigneeId: user.id,
          createdById: user.id,
          title: 'Preparer la reunion hebdomadaire RH',
          category: 'Operations RH',
          dueAt: tomorrowAt(9),
        },
      ],
    });
  }

  if (notificationCount === 0) {
    await prisma.userNotification.createMany({
      data: [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: 'LEAVE_REQUEST',
          title: 'Demande de conge en attente',
          message: '2 validations requises',
        },
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: 'PAYROLL_READY',
          title: 'Paie du mois prete',
          message: 'Le lot de paie est disponible',
        },
      ],
    });
  }

  if (messageCount === 0) {
    await prisma.userMessage.createMany({
      data: [
        {
          tenantId: user.tenantId,
          senderId: user.id,
          recipientId: user.id,
          title: 'Admin RH',
          message: 'Merci de verifier le dossier candidat.',
        },
        {
          tenantId: user.tenantId,
          senderId: user.id,
          recipientId: user.id,
          title: 'Finance',
          message: 'Le rapport de paie est pret.',
        },
      ],
    });
  }
}

async function main() {
  await ensureDefaultTenant();
  await upsertModules();
  await upsertPermissions();
  await upsertRoles();
  const superAdmin = await ensureSuperAdmin();
  await ensureWorkspaceSeedData(superAdmin);

  console.log('Seed Prisma termine.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
