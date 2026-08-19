const {
  ensureDepartmentFolder,
} = require('../utils/employee-folders');
const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'department';
}

function serializeDepartment(department) {
  return {
    id: department.id,
    code: department.code,
    name: department.name,
    description: department.description,
    parentId: department.parentId,
    managerEmployeeId: department.managerEmployeeId,
    parent: department.parent
      ? {
          id: department.parent.id,
          code: department.parent.code,
          name: department.parent.name,
        }
      : null,
    manager: department.manager
      ? {
          id: department.manager.id,
          employeeNumber: department.manager.employeeNumber,
          fullName: `${department.manager.firstName || ''} ${department.manager.lastName || ''}`.trim(),
        }
      : null,
    counts: {
      employees: department._count?.employees || 0,
      positions: department._count?.positions || 0,
      children: department._count?.children || 0,
    },
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}

async function listDepartments() {
  const departments = await prisma.department.findMany({
    orderBy: [
      { name: 'asc' },
    ],
    include: {
      parent: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          employees: true,
          positions: true,
          children: true,
        },
      },
    },
  });

  return departments.map(serializeDepartment);
}

async function createDepartment(payload) {
  const name = String(payload.name || '').trim();
  const code = String(payload.code || '').trim() || slugify(name);

  if (!name) {
    throw new AppError(400, 'Le nom du departement est obligatoire.');
  }

  const data = {
    code,
    name,
    description: String(payload.description || '').trim() || null,
    parentId: payload.parentId ? String(payload.parentId).trim() : null,
    managerEmployeeId: payload.managerEmployeeId ? String(payload.managerEmployeeId).trim() : null,
  };

  const department = await prisma.department.upsert({
    where: { code },
    update: data,
    create: data,
    include: {
      parent: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          employees: true,
          positions: true,
          children: true,
        },
      },
    },
  });

  ensureDepartmentFolder(department.code);

  return serializeDepartment(department);
}

async function updateDepartment(departmentId, payload) {
  const existingDepartment = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!existingDepartment) {
    throw new AppError(404, 'Departement introuvable.');
  }

  const name = payload.name !== undefined ? String(payload.name || '').trim() : existingDepartment.name;
  const code = payload.code !== undefined
    ? String(payload.code || '').trim() || slugify(name)
    : existingDepartment.code;

  const department = await prisma.department.update({
    where: { id: departmentId },
    data: {
      code,
      name,
      description: payload.description !== undefined ? String(payload.description || '').trim() || null : existingDepartment.description,
      parentId: payload.parentId !== undefined ? (payload.parentId ? String(payload.parentId).trim() : null) : existingDepartment.parentId,
      managerEmployeeId: payload.managerEmployeeId !== undefined
        ? (payload.managerEmployeeId ? String(payload.managerEmployeeId).trim() : null)
        : existingDepartment.managerEmployeeId,
    },
    include: {
      parent: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          employees: true,
          positions: true,
          children: true,
        },
      },
    },
  });

  ensureDepartmentFolder(department.code);

  return serializeDepartment(department);
}

async function deleteDepartment(departmentId) {
  const existingDepartment = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });

  if (!existingDepartment) {
    throw new AppError(404, 'Departement introuvable.');
  }

  await prisma.department.delete({
    where: { id: departmentId },
  });

  return { success: true };
}

module.exports = {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
};
