const {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} = require('../services/department.service');

async function listDepartmentsController(req, res) {
  const departments = await listDepartments();
  res.status(200).json({ departments });
}

async function createDepartmentController(req, res) {
  const department = await createDepartment(req.body);
  res.status(201).json({ department });
}

async function updateDepartmentController(req, res) {
  const department = await updateDepartment(req.params.departmentId, req.body);
  res.status(200).json({ department });
}

async function deleteDepartmentController(req, res) {
  await deleteDepartment(req.params.departmentId);
  res.status(200).json({ message: 'Departement supprime.' });
}

module.exports = {
  createDepartmentController,
  deleteDepartmentController,
  listDepartmentsController,
  updateDepartmentController,
};
