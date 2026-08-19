import React, { useEffect, useState } from 'react';
import EmployeeSummary from '../components/Dashboard/EmployeeSummary';
import AttendanceSummary from '../components/Dashboard/AttendanceSummary';
import LeaveRequest from '../components/Dashboard/LeaveRequest';
import JobApplicant from '../components/Dashboard/JobApplicant';
import CalendarSchedulesBlock from '../components/Dashboard/CalendarSchedulesBlock';
import AttendanceReport from '../components/Dashboard/AttendanceReport';
import EmployeeSatisfaction from '../components/Dashboard/EmployeeSatisfaction';
import TeamPerformance from '../components/Dashboard/TeamPerformance';
import EmploymentStatus from '../components/Dashboard/EmploymentStatus';
import TasksCard from '../components/Dashboard/TasksCard';
import { getDashboardSummary } from '../services/dashboardApi';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({});
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getDashboardSummary()
      .then((data) => {
        if (isMounted) setDashboardData(data);
      })
      .catch((error) => {
        if (isMounted) setDashboardError(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-text">Tableau de bord</h2>

      {dashboardError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {dashboardError}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EmployeeSummary data={dashboardData.employees} />
        <AttendanceSummary data={dashboardData.attendance} />
        <LeaveRequest data={dashboardData.leaveRequests} />
        <JobApplicant data={dashboardData.applications} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <CalendarSchedulesBlock data={dashboardData.planning} />
        </div>
        <div className="min-w-0 space-y-4">
          <AttendanceReport data={dashboardData.attendanceReport} />
          <EmployeeSatisfaction data={dashboardData.satisfaction} />
        </div>
        <div className="min-w-0 space-y-4">
          <TeamPerformance data={dashboardData.teamPerformance} />
          <EmploymentStatus data={dashboardData.employmentStatus} />
          <TasksCard />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
