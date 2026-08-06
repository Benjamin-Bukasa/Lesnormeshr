import {
  LEAVE_BALANCES,
  LEAVE_CALENDAR_EVENTS,
  LEAVE_COMPLIANCE_ALERTS,
  LEAVE_DASHBOARD,
  LEAVE_POLICY_SNAPSHOT,
  LEAVE_REQUESTS,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
} from '../mocks/leaveMockData';

const wait = (value, delay = 120) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });

const clone = (value) => JSON.parse(JSON.stringify(value));

export function getLeaveDashboard() {
  return wait(clone(LEAVE_DASHBOARD));
}

export function getLeaveRequests() {
  return wait(clone(LEAVE_REQUESTS));
}

export function getLeaveApprovals() {
  return wait(clone(LEAVE_REQUESTS.filter((request) => !['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status))));
}

export function getLeaveBalances() {
  return wait(clone(LEAVE_BALANCES));
}

export function getLeaveCalendarEvents() {
  return wait(clone(LEAVE_CALENDAR_EVENTS));
}

export function getLeaveComplianceAlerts() {
  return wait(clone(LEAVE_COMPLIANCE_ALERTS));
}

export function getLeavePolicySnapshot() {
  return wait(clone(LEAVE_POLICY_SNAPSHOT));
}

export function getLeaveFilterOptions() {
  return wait({
    statuses: clone(LEAVE_STATUS_OPTIONS),
    leaveTypes: clone(LEAVE_TYPE_OPTIONS),
  });
}
