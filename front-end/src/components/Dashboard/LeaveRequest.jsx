import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const LeaveRequest = ({ data = {} }) => {
  return (
    <SummaryStatCard
      title="Demandes de conge"
      value={data.pending ?? 0}
      unitLabel="En attente de validation"
      trend={`${data.newThisWeek ?? 0} nouvelle${data.newThisWeek === 1 ? '' : 's'} cette semaine`}
      to="/Leave"
    />
  );
};

export default LeaveRequest;
