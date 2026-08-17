import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const AttendanceSummary = ({ data = {} }) => {
  return (
    <SummaryStatCard
      title="Taux de presence"
      value={`${data.rate ?? 0}%`}
      unitLabel="Cette semaine"
      trend={data.trend || 'Aucune presence enregistree'}
      to="/TimeAttendance"
    />
  );
};

export default AttendanceSummary;
