import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const EmployeeSummary = () => {
  return (
    <SummaryStatCard
      title="Total employes"
      value="150"
      unitLabel="Employés"
      trend="10% d'augmentation ce mois"
      to="/Employees/Liste-Employes"
    />
  );
};

export default EmployeeSummary;
