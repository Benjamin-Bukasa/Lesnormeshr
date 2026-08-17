import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const EmployeeSummary = ({ data = {} }) => {
  return (
    <SummaryStatCard
      title="Total employes"
      value={data.total ?? 0}
      unitLabel="Employes"
      trend={data.trend || 'Aucune evolution enregistree'}
      to="/Employees/Liste-Employes"
    />
  );
};

export default EmployeeSummary;
