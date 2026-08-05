import React from 'react';
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

function Dashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-text">Tableau de bord</h2>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EmployeeSummary />
        <AttendanceSummary />
        <LeaveRequest />
        <JobApplicant />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <CalendarSchedulesBlock />
        </div>
        <div className="min-w-0 space-y-4">
          <AttendanceReport />
          <EmployeeSatisfaction />
        </div>
        <div className="min-w-0 space-y-4">
          <TeamPerformance />
          <EmploymentStatus />
          <TasksCard />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
