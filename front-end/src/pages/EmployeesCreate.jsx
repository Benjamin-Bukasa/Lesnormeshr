import React from 'react';
import { useToast } from '../components/ui';
import AddEmployeeForm from '../components/Employees/AddEmployeeForm';
import { createEmployee } from '../services/employeesApi';

function EmployeesCreate() {
  const toast = useToast();

  const handleCreateEmployee = async (values) => {
    try {
      const employee = await createEmployee(values);
      toast.success(`Employe cree : ${employee.employeeNumber}.`);
    } catch (error) {
      toast.error(error.message || "Impossible de creer l'employe.");
      throw error;
    }
  };

  return <AddEmployeeForm onSubmit={handleCreateEmployee} />;
}

export default EmployeesCreate;
