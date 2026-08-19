const {
  deleteEmployeeDocument,
  listEmployeeDocuments,
  listEmployeeDocumentsByEmployee,
  uploadEmployeeDocument,
  verifyEmployeeDocument,
} = require('../services/employee-document.service');

async function listEmployeeDocumentsController(req, res) {
  const result = await listEmployeeDocuments({
    ...req.query,
  }, req.auth.tenantId);

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

async function uploadEmployeeDocumentController(req, res) {
  const result = await uploadEmployeeDocument({
    file: req.file,
    employeeId: req.params.employeeId,
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
  deleteEmployeeDocumentController,
  listEmployeeDocumentsByEmployeeController,
  listEmployeeDocumentsController,
  uploadEmployeeDocumentController,
  verifyEmployeeDocumentController,
};
