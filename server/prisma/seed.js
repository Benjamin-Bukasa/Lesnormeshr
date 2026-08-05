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
      return;
    }

    console.log('Le super admin existe deja.');
    return;
  }

  const password = env.superAdminPassword || 'ChangeMe123!';

  await prisma.user.create({
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
}

async function main() {
  await ensureDefaultTenant();
  await upsertModules();
  await upsertPermissions();
  await upsertRoles();
  await ensureSuperAdmin();

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
