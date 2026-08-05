import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const JobApplicant = () => {
  return (
    <SummaryStatCard
      title="Candidatures"
      value="47"
      unitLabel="Profils recents"
      trend="12 nouveaux candidats cette semaine"
      to="/Recruitment/Selection-Entretiens"
    />
  );
};

export default JobApplicant;
