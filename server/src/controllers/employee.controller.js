const {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
  updateEmployeeStatus,
} = require('../services/employee.service');

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

async function deleteEmployeeController(req, res) {
  await deleteEmployee(req.params.employeeId, {
    tenantId: req.auth.tenantId,
  });

  res.status(200).json({ message: 'Employe supprime.' });
}

module.exports = {
  createEmployeeController,
  deleteEmployeeController,
  getEmployeeController,
  listEmployeesController,
  updateEmployeeController,
  updateEmployeeStatusController,
};
