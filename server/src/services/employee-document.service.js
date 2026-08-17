const fs = require('fs');
const path = require('path');

const {
  EmployeeDocumentCategory,
} = require('@prisma/client');

const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');
const { buildPagination, parsePagination } = require('../utils/pagination');
const { buildEmployeeDocumentPaths, ensureEmployeeFolder } = require('../utils/employee-folders');

const employeeDocumentInclude = {
  employee: {
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      workEmail: true,
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
    },
  },
  uploadedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  verifiedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
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

function ensureEnumValue(enumSource, value, fieldName) {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized || !enumSource[normalized]) {
    throw new AppError(400, `Valeur invalide pour ${fieldName}.`);
  }

  return enumSource[normalized];
}

function parseDate(value, fieldName) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `Date invalide pour ${fieldName}.`);
  }

  return parsed;
}

function serializeEmployeeDocument(document) {
  return {
    id: document.id,
    employeeId: document.employeeId,
    category: document.category,
    title: document.title,
    documentNumber: document.documentNumber,
    issuedBy: document.issuedBy,
    issuedAt: document.issuedAt,
    expiresAt: document.expiresAt,
    originalName: document.originalName,
    storedName: document.storedName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    storagePath: document.storagePath,
    publicUrl: document.publicUrl,
    uploadedByUserId: document.uploadedByUserId,
    verifiedByUserId: document.verifiedByUserId,
    verifiedAt: document.verifiedAt,
    employee: document.employee
      ? {
          id: document.employee.id,
          employeeNumber: document.employee.employeeNumber,
          fullName: `${document.employee.firstName || ''} ${document.employee.lastName || ''}`.trim(),
          department: document.employee.department
            ? {
                id: document.employee.department.id,
                code: document.employee.department.code,
                name: document.employee.department.name,
              }
            : null,
          position: document.employee.position
            ? {
                id: document.employee.position.id,
                code: document.employee.position.code,
                title: document.employee.position.title,
              }
            : null,
        }
      : null,
    uploadedBy: document.uploadedBy
      ? {
          id: document.uploadedBy.id,
          fullName: `${document.uploadedBy.firstName || ''} ${document.uploadedBy.lastName || ''}`.trim(),
          email: document.uploadedBy.email,
        }
      : null,
    verifiedBy: document.verifiedBy
      ? {
          id: document.verifiedBy.id,
          fullName: `${document.verifiedBy.firstName || ''} ${document.verifiedBy.lastName || ''}`.trim(),
          email: document.verifiedBy.email,
        }
      : null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    status: document.verifiedAt ? 'VERIFIED' : 'PENDING',
  };
}

async function ensureEmployee(employeeId, tenantId) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      tenantId,
    },
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      department: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  if (!employee) {
    throw new AppError(404, 'Employe introuvable.');
  }

  return employee;
}

async function ensureDocument(documentId, tenantId) {
  const document = await prisma.employeeDocument.findFirst({
    where: {
      id: documentId,
      employee: {
        tenantId,
      },
    },
    include: employeeDocumentInclude,
  });

  if (!document) {
    throw new AppError(404, 'Document introuvable.');
  }

  return document;
}

async function listEmployeeDocuments(filters = {}, tenantId) {
  const where = {
    employee: {
      tenantId,
    },
  };

  if (filters.employeeId) {
    where.employeeId = String(filters.employeeId);
  }

  if (filters.departmentId) {
    where.employee = {
      ...where.employee,
      departmentId: String(filters.departmentId),
    };
  }

  if (filters.category) {
    where.category = ensureEnumValue(EmployeeDocumentCategory, filters.category, 'category');
  }

  if (filters.search) {
    const search = normalizeText(filters.search);
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { originalName: { contains: search, mode: 'insensitive' } },
      { documentNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const { page, limit, skip, take } = parsePagination(filters);

  const [totalItems, items] = await Promise.all([
    prisma.employeeDocument.count({ where }),
    prisma.employeeDocument.findMany({
      where,
      skip,
      take,
      include: employeeDocumentInclude,
      orderBy: [
        { createdAt: 'desc' },
      ],
    }),
  ]);

  return {
    items: items.map(serializeEmployeeDocument),
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function listEmployeeDocumentsByEmployee(employeeId, tenantId, filters = {}) {
  return listEmployeeDocuments({
    ...filters,
    employeeId,
  }, tenantId);
}

async function uploadEmployeeDocument(payload, actorId, tenantId) {
  const { file, employeeId, title, category, documentNumber, issuedBy, issuedAt, expiresAt } = payload;

  if (!file) {
    throw new AppError(400, 'Fichier requis.');
  }

  if (!employeeId) {
    throw new AppError(400, 'employeeId est obligatoire.');
  }

  const employee = await ensureEmployee(employeeId, tenantId);
  const folderPaths = buildEmployeeDocumentPaths({
    departmentCode: employee.department?.code,
    employeeNumber: employee.employeeNumber,
    fileName: file.filename,
  });

  if (file.path && file.path !== folderPaths.storagePath) {
    fs.mkdirSync(path.dirname(folderPaths.storagePath), { recursive: true });
    fs.renameSync(file.path, folderPaths.storagePath);
  }

  ensureEmployeeFolder(employee.department?.code, employee.employeeNumber);

  const document = await prisma.employeeDocument.create({
    data: {
      employeeId,
      category: category
        ? ensureEnumValue(EmployeeDocumentCategory, category, 'category')
        : EmployeeDocumentCategory.OTHER,
      title: String(title || '').trim() || file.originalname,
      documentNumber: String(documentNumber || '').trim() || null,
      issuedBy: String(issuedBy || '').trim() || null,
      issuedAt: parseDate(issuedAt, 'issuedAt'),
      expiresAt: parseDate(expiresAt, 'expiresAt'),
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype || null,
      sizeBytes: file.size,
      storagePath: folderPaths.storagePath,
      publicUrl: folderPaths.publicUrl,
      uploadedByUserId: actorId,
    },
    include: employeeDocumentInclude,
  });

  return serializeEmployeeDocument(document);
}

async function verifyEmployeeDocument(documentId, actorId, tenantId) {
  await ensureDocument(documentId, tenantId);

  const updatedDocument = await prisma.employeeDocument.update({
    where: { id: documentId },
    data: {
      verifiedByUserId: actorId,
      verifiedAt: new Date(),
    },
    include: employeeDocumentInclude,
  });

  return serializeEmployeeDocument(updatedDocument);
}

async function deleteEmployeeDocument(documentId, tenantId) {
  const document = await ensureDocument(documentId, tenantId);

  if (document.storagePath && fs.existsSync(document.storagePath)) {
    fs.unlinkSync(document.storagePath);
  }

  await prisma.employeeDocument.delete({
    where: { id: documentId },
  });

  return { success: true };
}

module.exports = {
  deleteEmployeeDocument,
  listEmployeeDocuments,
  listEmployeeDocumentsByEmployee,
  uploadEmployeeDocument,
  verifyEmployeeDocument,
};
