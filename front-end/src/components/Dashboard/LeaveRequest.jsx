import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const LeaveRequest = () => {
  return (
    <SummaryStatCard
      title="Demandes de conge"
      value="18"
      unitLabel="En attente de validation"
      trend="6 nouvelles demandes aujourd'hui"
      to="/Leave"
    />
  );
};

export default LeaveRequest;
