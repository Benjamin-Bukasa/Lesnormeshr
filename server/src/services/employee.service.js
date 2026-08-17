const {
  CompensationType,
  EmployeeLifecycleStatus,
  EmploymentType,
  Gender,
  MaritalStatus,
  PayFrequency,
  PaymentMethod,
} = require('@prisma/client');

const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');
const { buildPagination, parsePagination } = require('../utils/pagination');
const { ensureEmployeeFolder } = require('../utils/employee-folders');

const DEPARTMENT_PRESETS = {
  rh: { code: 'rh', name: 'Ressources humaines' },
  finance: { code: 'finance', name: 'Finance' },
  it: { code: 'it', name: 'Informatique' },
  operations: { code: 'operations', name: 'Operations' },
  juridique: { code: 'juridique', name: 'Juridique' },
  support: { code: 'support', name: 'Support' },
  marketing: { code: 'marketing', name: 'Marketing' },
};

const POSITION_PRESETS = {
  hr_manager: { code: 'hr_manager', title: 'Responsable RH' },
  hr_officer: { code: 'hr_officer', title: 'Charge RH' },
  payroll_manager: { code: 'payroll_manager', title: 'Gestionnaire paie' },
  frontend_dev: { code: 'frontend_dev', title: 'Developpeur frontend' },
  backend_dev: { code: 'backend_dev', title: 'Developpeur backend' },
  accountant: { code: 'accountant', title: 'Comptable' },
  legal_assistant: { code: 'legal_assistant', title: 'Assistante juridique' },
  operations_coordinator: { code: 'operations_coordinator', title: 'Coordinateur operations' },
  support_technician: { code: 'support_technician', title: 'Technicien support' },
  communication_specialist: { code: 'communication_specialist', title: 'Specialiste communication' },
  administrative_assistant: { code: 'administrative_assistant', title: 'Assistante administrative' },
};

const LOCATION_PRESETS = {
  kinshasa_hq: { code: 'kinshasa_hq', name: 'Kinshasa - Siege', city: 'Kinshasa', country: 'RDC', isHeadOffice: true },
  kinshasa_gombe: { code: 'kinshasa_gombe', name: 'Kinshasa - Gombe', city: 'Kinshasa', country: 'RDC' },
  lubumbashi: { code: 'lubumbashi', name: 'Lubumbashi', city: 'Lubumbashi', country: 'RDC' },
  remote: { code: 'remote', name: 'Remote' },
};

const COST_CENTER_PRESETS = {
  'cc-rh': { code: 'CC-RH', name: 'CC-RH' },
  'cc-fin': { code: 'CC-FIN', name: 'CC-FIN' },
  'cc-it': { code: 'CC-IT', name: 'CC-IT' },
  'cc-ops': { code: 'CC-OPS', name: 'CC-OPS' },
};

const employeeInclude = {
  tenant: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  department: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  position: {
    select: {
      id: true,
      code: true,
      title: true,
    },
  },
  location: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  costCenter: {
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
  payrollProfile: true,
  _count: {
    select: {
      documents: true,
      employmentEvents: true,
    },
  },
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `Date invalide : ${value}`);
  }

  return parsed;
}

function toNullableString(value) {
  const text = String(value || '').trim();
  return text ? text : null;
}

function parseEnum(value, enumSource, fieldName, { required = false } = {}) {
  const raw = String(value || '').trim();
  if (!raw) {
    if (required) {
      throw new AppError(400, `Le champ ${fieldName} est obligatoire.`);
    }
    return null;
  }

  const normalized = raw.toUpperCase();
  if (!enumSource[normalized]) {
    throw new AppError(400, `Valeur invalide pour ${fieldName}.`);
  }

  return enumSource[normalized];
}

function parseMoney(value, fieldName, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(400, `Le champ ${fieldName} est obligatoire.`);
    }
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new AppError(400, `Valeur invalide pour ${fieldName}.`);
  }

  return parsed;
}

function employeeStatusMeta(status) {
  return {
    ACTIVE: { label: 'Actif', tone: 'success' },
    PROBATION: { label: 'Probation', tone: 'warning' },
    ON_LEAVE: { label: 'En conge', tone: 'info' },
    SUSPENDED: { label: 'Suspendu', tone: 'danger' },
    ARCHIVED: { label: 'Archive', tone: 'neutral' },
  }[status] || { label: status, tone: 'neutral' };
}

function serializeEmployee(employee) {
  const statusMeta = employeeStatusMeta(employee.employmentStatus);

  return {
    id: employee.id,
    tenantId: employee.tenantId,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    preferredName: employee.preferredName,
    workEmail: employee.workEmail,
    workPhone: employee.workPhone,
    personalEmail: employee.personalEmail,
    personalPhone: employee.personalPhone,
    dateOfBirth: employee.dateOfBirth,
    hireDate: employee.hireDate,
    probationEndDate: employee.probationEndDate,
    nationality: employee.nationality,
    nationalIdNumber: employee.nationalIdNumber,
    taxNumber: employee.taxNumber,
    socialSecurityNumber: employee.socialSecurityNumber,
    gender: employee.gender,
    maritalStatus: employee.maritalStatus,
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    department: employee.department,
    position: employee.position,
    location: employee.location,
    costCenter: employee.costCenter,
    manager: employee.manager
      ? {
          id: employee.manager.id,
          employeeNumber: employee.manager.employeeNumber,
          fullName: `${employee.manager.firstName} ${employee.manager.lastName}`.trim(),
        }
      : null,
    payrollProfile: employee.payrollProfile
      ? {
          id: employee.payrollProfile.id,
          baseSalary: Number(employee.payrollProfile.baseSalary || 0),
          currency: employee.payrollProfile.currency,
          payFrequency: employee.payrollProfile.payFrequency,
          paymentMethod: employee.payrollProfile.paymentMethod,
        }
      : null,
    documentCount: employee._count?.documents || 0,
    ui: {
      statusLabel: statusMeta.label,
      statusTone: statusMeta.tone,
      departmentLabel: employee.department?.name || '',
      positionLabel: employee.position?.title || '',
      locationLabel: employee.location?.name || '',
      costCenterLabel: employee.costCenter?.name || employee.costCenter?.code || '',
    },
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

async function ensureEmployeeBelongsToTenant(employeeId, tenantId) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      tenantId,
    },
    include: employeeInclude,
  });

  if (!employee) {
    throw new AppError(404, 'Employe introuvable.');
  }

  return employee;
}

async function resolveDepartmentId(rawValue) {
  const normalized = normalizeText(rawValue);
  if (!normalized) return null;

  const preset = DEPARTMENT_PRESETS[normalized] || { code: slugify(rawValue), name: String(rawValue).trim() };

  const department = await prisma.department.upsert({
    where: { code: preset.code },
    update: {
      name: preset.name,
    },
    create: {
      code: preset.code,
      name: preset.name,
    },
  });

  return department.id;
}

async function resolvePositionId(rawValue, departmentId) {
  const normalized = normalizeText(rawValue);
  if (!normalized) return null;

  const preset = POSITION_PRESETS[normalized] || { code: slugify(rawValue), title: String(rawValue).trim() };

  const position = await prisma.position.upsert({
    where: { code: preset.code },
    update: {
      title: preset.title,
      departmentId,
    },
    create: {
      code: preset.code,
      title: preset.title,
      departmentId,
    },
  });

  return position.id;
}

async function resolveLocationId(rawValue) {
  const normalized = normalizeText(rawValue);
  if (!normalized) return null;

  const preset = LOCATION_PRESETS[normalized] || { code: slugify(rawValue), name: String(rawValue).trim() };

  const location = await prisma.workLocation.upsert({
    where: { code: preset.code },
    update: {
      name: preset.name,
      city: preset.city || null,
      country: preset.country || null,
      isHeadOffice: Boolean(preset.isHeadOffice),
    },
    create: {
      code: preset.code,
      name: preset.name,
      city: preset.city || null,
      country: preset.country || null,
      isHeadOffice: Boolean(preset.isHeadOffice),
    },
  });

  return location.id;
}

async function resolveCostCenterId(rawValue) {
  const normalized = normalizeText(rawValue);
  if (!normalized) return null;

  const preset = COST_CENTER_PRESETS[normalized] || { code: String(rawValue).trim().toUpperCase(), name: String(rawValue).trim().toUpperCase() };

  const costCenter = await prisma.costCenter.upsert({
    where: { code: preset.code },
    update: {
      name: preset.name,
    },
    create: {
      code: preset.code,
      name: preset.name,
    },
  });

  return costCenter.id;
}

async function resolveManagerId(rawValue, tenantId, employeeIdToExclude = null) {
  const text = String(rawValue || '').trim();
  if (!text) return null;

  const manager = await prisma.employee.findFirst({
    where: {
      tenantId,
      id: employeeIdToExclude ? { not: employeeIdToExclude } : undefined,
      OR: [
        { id: text },
        { employeeNumber: text },
      ],
    },
    select: { id: true },
  });

  if (!manager) {
    throw new AppError(400, 'Manager introuvable pour ce tenant.');
  }

  return manager.id;
}

async function buildEmployeeWriteData(payload, tenantId, employeeId = null) {
  const employeeNumber = toNullableString(payload.employeeNumber);
  const firstName = toNullableString(payload.firstName);
  const lastName = toNullableString(payload.lastName);
  const workEmail = toNullableString(payload.workEmail);
  const hireDate = toDate(payload.hireDate);

  if (!employeeNumber || !firstName || !lastName || !workEmail || !hireDate) {
    throw new AppError(400, 'Les champs employeeNumber, firstName, lastName, workEmail et hireDate sont obligatoires.');
  }

  const departmentId = await resolveDepartmentId(payload.department);
  const positionId = await resolvePositionId(payload.position, departmentId);
  const locationId = await resolveLocationId(payload.location);
  const costCenterId = await resolveCostCenterId(payload.costCenter);
  const managerEmployeeId = await resolveManagerId(payload.managerEmployeeId, tenantId, employeeId);

  return {
    tenantId,
    employeeNumber,
    firstName,
    lastName,
    preferredName: toNullableString(payload.preferredName),
    workEmail,
    workPhone: toNullableString(payload.workPhone),
    personalEmail: toNullableString(payload.personalEmail),
    personalPhone: toNullableString(payload.personalPhone),
    dateOfBirth: toDate(payload.dateOfBirth),
    probationEndDate: toDate(payload.probationEndDate),
    nationality: toNullableString(payload.nationality),
    nationalIdNumber: toNullableString(payload.nationalIdNumber),
    taxNumber: toNullableString(payload.taxNumber),
    socialSecurityNumber: toNullableString(payload.socialSecurityNumber),
    gender: parseEnum(payload.gender, Gender, 'gender'),
    maritalStatus: parseEnum(payload.maritalStatus, MaritalStatus, 'maritalStatus'),
    employmentType: parseEnum(payload.employmentType, EmploymentType, 'employmentType', { required: true }),
    employmentStatus: parseEnum(payload.employeeStatus || payload.employmentStatus, EmployeeLifecycleStatus, 'employeeStatus', { required: true }),
    hireDate,
    departmentId,
    positionId,
    locationId,
    costCenterId,
    managerEmployeeId,
  };
}

function buildPayrollWriteData(payload) {
  const baseSalary = parseMoney(payload.baseSalary, 'baseSalary');
  const currency = toNullableString(payload.currency);
  const payFrequency = parseEnum(payload.payFrequency, PayFrequency, 'payFrequency');
  const paymentMethod = parseEnum(payload.paymentMethod, PaymentMethod, 'paymentMethod');

  if (baseSalary === null && !currency && !payFrequency && !paymentMethod) {
    return null;
  }

  if (baseSalary === null || !currency || !payFrequency || !paymentMethod) {
    throw new AppError(400, 'Le bloc paie doit inclure baseSalary, currency, payFrequency et paymentMethod.');
  }

  return {
    baseSalary,
    currency,
    payFrequency,
    paymentMethod,
    taxIdentifier: toNullableString(payload.taxNumber),
    socialSecurityNumber: toNullableString(payload.socialSecurityNumber),
  };
}

async function listEmployees(query) {
  const tenantId = String(query.tenantId || '').trim();
  if (!tenantId) {
    throw new AppError(400, 'tenantId requis.');
  }

  const { page, skip, take, limit } = parsePagination(query);
  const search = String(query.search || '').trim();
  const status = parseEnum(query.status, EmployeeLifecycleStatus, 'status');

  const where = {
    tenantId,
    ...(status ? { employmentStatus: status } : {}),
    ...(search
      ? {
          OR: [
            { employeeNumber: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { workEmail: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: employeeInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    items: items.map(serializeEmployee),
    pagination: buildPagination(page, limit, total),
  };
}

async function getEmployeeById(employeeId, tenantId) {
  const employee = await ensureEmployeeBelongsToTenant(employeeId, tenantId);
  return serializeEmployee(employee);
}

async function createEmployee(payload, context) {
  const tenantId = String(context?.tenantId || '').trim();
  if (!tenantId) {
    throw new AppError(400, 'tenantId requis.');
  }

  const employeeData = await buildEmployeeWriteData(payload, tenantId);
  const payrollData = buildPayrollWriteData(payload);

  const employee = await prisma.$transaction(async (tx) => {
    const created = await tx.employee.create({
      data: employeeData,
      include: employeeInclude,
    });

    if (payrollData) {
      await tx.payrollProfile.upsert({
        where: { employeeId: created.id },
        update: payrollData,
        create: {
          employeeId: created.id,
          ...payrollData,
        },
      });
    }

    return tx.employee.findUnique({
      where: { id: created.id },
      include: employeeInclude,
    });
  });

  ensureEmployeeFolder(employee.department?.code, employee.employeeNumber);

  return serializeEmployee(employee);
}

async function updateEmployee(employeeId, payload, context) {
  const tenantId = String(context?.tenantId || '').trim();
  await ensureEmployeeBelongsToTenant(employeeId, tenantId);

  const employeeData = await buildEmployeeWriteData(payload, tenantId, employeeId);
  const payrollData = buildPayrollWriteData(payload);

  const employee = await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: employeeData,
    });

    if (payrollData) {
      await tx.payrollProfile.upsert({
        where: { employeeId },
        update: payrollData,
        create: {
          employeeId,
          ...payrollData,
        },
      });
    }

    return tx.employee.findUnique({
      where: { id: employeeId },
      include: employeeInclude,
    });
  });

  ensureEmployeeFolder(employee.department?.code, employee.employeeNumber);

  return serializeEmployee(employee);
}

async function updateEmployeeStatus(employeeId, status, context) {
  const tenantId = String(context?.tenantId || '').trim();
  const normalizedStatus = parseEnum(status, EmployeeLifecycleStatus, 'status', { required: true });
  await ensureEmployeeBelongsToTenant(employeeId, tenantId);

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      employmentStatus: normalizedStatus,
    },
    include: employeeInclude,
  });

  return serializeEmployee(employee);
}

async function deleteEmployee(employeeId, context) {
  const tenantId = String(context?.tenantId || '').trim();
  await ensureEmployeeBelongsToTenant(employeeId, tenantId);

  await prisma.employee.delete({
    where: { id: employeeId },
  });

  return { success: true };
}

module.exports = {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
  updateEmployeeStatus,
};
