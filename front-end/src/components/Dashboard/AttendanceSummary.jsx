import React from 'react';
import SummaryStatCard from './SummaryStatCard';

const AttendanceSummary = () => {
  return (
    <SummaryStatCard
      title="Taux de presence"
      value="92%"
      unitLabel="Cette semaine"
      trend="+3% par rapport a la semaine precedente"
      to="/TimeAttendance"
    />
  );
};

export default AttendanceSummary;
