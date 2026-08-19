const fs = require('fs');
const path = require('path');

const employeeDocumentsRoot = path.join(__dirname, '..', '..', 'uploads', 'employees');

fs.mkdirSync(employeeDocumentsRoot, { recursive: true });

function normalizeFolderSegment(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
}

function ensureDepartmentFolder(departmentCode) {
  const folderPath = path.join(employeeDocumentsRoot, normalizeFolderSegment(departmentCode));
  fs.mkdirSync(folderPath, { recursive: true });
  return folderPath;
}

function ensureEmployeeFolder(departmentCode, employeeNumber) {
  const departmentFolder = ensureDepartmentFolder(departmentCode);
  const employeeFolder = path.join(departmentFolder, normalizeFolderSegment(employeeNumber));
  fs.mkdirSync(employeeFolder, { recursive: true });
  return employeeFolder;
}

function buildEmployeeDocumentPaths({ departmentCode, employeeNumber, fileName }) {
  const employeeFolder = ensureEmployeeFolder(departmentCode, employeeNumber);
  const storedName = String(fileName || '').trim() || `document-${Date.now()}`;

  return {
    employeeFolder,
    storagePath: path.join(employeeFolder, storedName),
    publicUrl: `/uploads/employees/${normalizeFolderSegment(departmentCode)}/${normalizeFolderSegment(employeeNumber)}/${storedName}`,
  };
}

module.exports = {
  buildEmployeeDocumentPaths,
  employeeDocumentsRoot,
  ensureDepartmentFolder,
  ensureEmployeeFolder,
  normalizeFolderSegment,
};
