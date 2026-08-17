import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const JobApplicant = ({ data = {} }) => {
  return (
    <SummaryStatCard
      title="Candidatures"
      value={data.active ?? 0}
      unitLabel="Candidatures actives"
      trend={`${data.newThisWeek ?? 0} nouvelle${data.newThisWeek === 1 ? '' : 's'} cette semaine`}
      to="/Recruitment/Selection-Entretiens"
    />
  );
};

export default JobApplicant;
