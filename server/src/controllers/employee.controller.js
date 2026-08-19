const {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  uploadEmployeeAvatar,
  updateEmployee,
  updateEmployeeStatus,
} = require('../services/employee.service');
const {
  deleteEmployeeDocument,
  listEmployeeDocuments,
  listEmployeeDocumentsByEmployee,
  uploadEmployeeDocument,
  verifyEmployeeDocument,
} = require('../services/employee-document.service');

async function listEmployeesController(req, res) {
  const result = await listEmployees({
    ...req.query,
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({
    data: result.items,
    pagination: result.pagination,
  });
}

async function listEmployeeDocumentsController(req, res) {
  const result = await listEmployeeDocuments({
    ...req.query,
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({
    data: result.items,
    pagination: result.pagination,
  });
}

async function listEmployeeDocumentsByEmployeeController(req, res) {
  const result = await listEmployeeDocumentsByEmployee(req.params.employeeId, req.auth.tenantId, req.query);
  res.status(200).json({
    data: result.items,
    pagination: result.pagination,
  });
}

async function getEmployeeController(req, res) {
  const result = await getEmployeeById(req.params.employeeId, req.auth.tenantId);
  res.status(200).json({ data: result });
}

async function createEmployeeController(req, res) {
  const result = await createEmployee(req.body, {
    tenantId: req.auth.tenantId,
  });

  res.status(201).json({ data: result });
}

async function updateEmployeeController(req, res) {
  const result = await updateEmployee(req.params.employeeId, req.body, {
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ data: result });
}

async function updateEmployeeStatusController(req, res) {
  const result = await updateEmployeeStatus(req.params.employeeId, req.body.status, {
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ data: result });
}

async function uploadEmployeeAvatarController(req, res) {
  const result = await uploadEmployeeAvatar(req.params.employeeId, req.auth.tenantId, req.file);
  res.status(200).json({ data: result });
}

async function deleteEmployeeController(req, res) {
  await deleteEmployee(req.params.employeeId, {
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ message: 'Employe supprime.' });
}

async function uploadEmployeeDocumentController(req, res) {
  const result = await uploadEmployeeDocument({
    file: req.file,
    employeeId: req.body.employeeId || req.params.employeeId,
    title: req.body.title,
    category: req.body.category,
    documentNumber: req.body.documentNumber,
    issuedBy: req.body.issuedBy,
    issuedAt: req.body.issuedAt,
    expiresAt: req.body.expiresAt,
  }, req.auth.user.id, req.auth.tenantId);

  res.status(201).json({ data: result });
}

async function verifyEmployeeDocumentController(req, res) {
  const result = await verifyEmployeeDocument(req.params.documentId, req.auth.user.id, req.auth.tenantId);
  res.status(200).json({ data: result });
}

async function deleteEmployeeDocumentController(req, res) {
  await deleteEmployeeDocument(req.params.documentId, req.auth.tenantId);
  res.status(200).json({ message: 'Document supprime.' });
}

module.exports = {
  createEmployeeController,
  deleteEmployeeController,
  deleteEmployeeDocumentController,
  getEmployeeController,
  listEmployeeDocumentsByEmployeeController,
  listEmployeeDocumentsController,
  listEmployeesController,
  updateEmployeeController,
  updateEmployeeStatusController,
  uploadEmployeeAvatarController,
  uploadEmployeeDocumentController,
  verifyEmployeeDocumentController,
};
