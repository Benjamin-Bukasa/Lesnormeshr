const {
  ApplicationStatus,
  AttendanceEntryStatus,
  EmployeeLifecycleStatus,
  InterviewStatus,
  LeaveRequestStatus,
  ReviewStatus,
} = require('@prisma/client');

const prisma = require('../lib/prisma');

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPLOYMENT_STATUS_ORDER = Object.values(EmployeeLifecycleStatus);

const EMPLOYMENT_STATUS_LABELS = {
  ACTIVE: 'Actif',
  PROBATION: 'Période d’essai',
  ON_LEAVE: 'En congé',
  SUSPENDED: 'Suspendu',
  TERMINATED: 'Sorti',
  RETIRED: 'Retraité',
  ARCHIVED: 'Archivé',
};

const EMPLOYMENT_TYPE_LABELS = {
  CDI: 'CDI',
  CDD: 'CDD',
  STAGE: 'Stage',
  FREELANCE: 'Freelance',
  CONSULTANT: 'Consultant',
  TEMPORAIRE: 'Temporaire',
  APPRENTISSAGE: 'Apprentissage',
  OTHER: 'Autre',
};

const INTERVIEW_TYPE_LABELS = {
  HR: 'Entretien RH',
  TECHNICAL: 'Entretien technique',
  MANAGERIAL: 'Entretien manager',
  FINAL: 'Entretien final',
};

const FEEDBACK_TYPE_LABELS = {
  PRAISE: 'Reconnaissance',
  CONSTRUCTIVE: 'Feedback constructif',
  COACHING: 'Accompagnement',
};

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(value) {
  const date = startOfDay(value);
  const day = date.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - distanceFromMonday);
  return date;
}

function startOfMonth(value) {
  const date = startOfDay(value);
  date.setDate(1);
  return date;
}

function addDays(value, amount) {
  return new Date(new Date(value).getTime() + amount * DAY_MS);
}

function addMonths(value, amount) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + amount);
  return date;
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function percentageChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return round(((current - previous) / previous) * 100);
}

function percentagePointChange(current, previous) {
  return round(current - previous);
}

function formatSigned(value, suffix = '%') {
  const normalized = round(value);
  if (normalized === 0) return `0${suffix}`;
  return `${normalized > 0 ? '+' : ''}${normalized}${suffix}`;
}

function getAttendanceWeight(status) {
  if ([
    AttendanceEntryStatus.PRESENT,
    AttendanceEntryStatus.LATE,
    AttendanceEntryStatus.REMOTE,
  ].includes(status)) return 1;
  if (status === AttendanceEntryStatus.HALF_DAY) return 0.5;
  return null;
}

function calculateAttendanceRate(records) {
  let total = 0;
  let attended = 0;

  records.forEach((record) => {
    const weight = getAttendanceWeight(record.status);
    if (weight === null && record.status !== AttendanceEntryStatus.ABSENT) return;
    total += 1;
    attended += weight || 0;
  });

  return total ? round((attended / total) * 100) : 0;
}

function getMonthKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(value) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(new Date(value))
    .replace('.', '')
    .replace(/^./, (character) => character.toUpperCase());
}

function buildAttendanceReport(records, weekStart) {
  const slots = [8, 8.5, 9, 9.5, 10, 10.5];
  const values = slots.map(() => [0, 0, 0, 0, 0]);

  records.forEach((record) => {
    if (!record.checkInAt) return;

    const workDate = new Date(record.workDate);
    const dayIndex = Math.floor((startOfDay(workDate).getTime() - startOfDay(weekStart).getTime()) / DAY_MS);
    if (dayIndex < 0 || dayIndex > 4) return;

    const checkIn = new Date(record.checkInAt);
    const decimalHour = checkIn.getHours() + (checkIn.getMinutes() >= 30 ? 0.5 : 0);
    let slotIndex = slots.findIndex((slot) => decimalHour <= slot);
    if (slotIndex < 0) slotIndex = slots.length - 1;
    values[slotIndex][dayIndex] += 1;
  });

  const maxValue = Math.max(1, ...values.flat());
  const rows = values.map((row, index) => ({
    time: `${String(Math.floor(slots[index])).padStart(2, '0')}:${slots[index] % 1 ? '30' : '00'}`,
    values: row.map((value) => (value ? Math.min(4, Math.ceil((value / maxValue) * 4)) : 0)),
  }));

  const days = Array.from({ length: 5 }, (_, index) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
    .format(addDays(weekStart, index))
    .replace('.', '')
    .replace(/^./, (character) => character.toUpperCase()));

  return { days, rows };
}

function buildStatusData(groups, total) {
  const counts = new Map(groups.map((group) => [group.employmentStatus, group._count._all]));

  return EMPLOYMENT_STATUS_ORDER
    .filter((status) => counts.has(status))
    .map((status) => ({
      id: status.toLowerCase(),
      label: EMPLOYMENT_STATUS_LABELS[status] || status,
      employees: counts.get(status),
      percent: total ? round((counts.get(status) / total) * 100) : 0,
    }));
}

function buildSatisfactionData(feedbacks, previousFeedbacks) {
  const rated = feedbacks.filter((feedback) => toNumber(feedback.rating) !== null);
  const previousRated = previousFeedbacks.filter((feedback) => toNumber(feedback.rating) !== null);
  const average = rated.length
    ? rated.reduce((sum, feedback) => sum + toNumber(feedback.rating), 0) / rated.length
    : 0;
  const previousAverage = previousRated.length
    ? previousRated.reduce((sum, feedback) => sum + toNumber(feedback.rating), 0) / previousRated.length
    : 0;
  const grouped = new Map();

  rated.forEach((feedback) => {
    const current = grouped.get(feedback.feedbackType) || { total: 0, sum: 0 };
    current.total += 1;
    current.sum += toNumber(feedback.rating);
    grouped.set(feedback.feedbackType, current);
  });

  return {
    percent: round((average / 5) * 100),
    score: round(average, 1),
    trend: formatSigned(percentagePointChange((average / 5) * 100, (previousAverage / 5) * 100), '%'),
    responseCount: rated.length,
    breakdown: Array.from(grouped.entries()).map(([type, value]) => ({
      id: type.toLowerCase(),
      title: FEEDBACK_TYPE_LABELS[type] || type,
      percent: round((value.sum / value.total / 5) * 100),
      score: round(value.sum / value.total, 1),
      responseCount: value.total,
    })),
  };
}

function buildPerformanceSeries(reviews, goals, now) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(addMonths(now, index - 5));
    return {
      key: getMonthKey(date),
      month: getMonthLabel(date),
      reviewScores: [],
      goalScores: [],
    };
  });
  const monthMap = new Map(months.map((month) => [month.key, month]));

  reviews.forEach((review) => {
    const bucket = monthMap.get(getMonthKey(review.createdAt));
    const score = toNumber(review.overallScore);
    if (bucket && score !== null) bucket.reviewScores.push(score);
  });

  goals.forEach((goal) => {
    const bucket = monthMap.get(getMonthKey(goal.updatedAt));
    const progress = toNumber(goal.progressPercent);
    if (bucket && progress !== null) bucket.goalScores.push(progress);
  });

  return months
    .map((month) => {
      const source = month.reviewScores.length ? month.reviewScores : month.goalScores;
      return {
        month: month.month,
        value: source.length ? round(source.reduce((sum, value) => sum + value, 0) / source.length, 1) : null,
      };
    })
    .filter((item) => item.value !== null);
}

function serializePlanningEvents(interviews) {
  return interviews.map((interview) => {
    const candidate = interview.application?.candidate;
    const candidateName = [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ');
    const postingTitle = interview.application?.jobPosting?.title || 'Candidature';
    const interviewer = interview.interviewer;

    return {
      id: interview.id,
      date: new Date(interview.scheduledAt).toISOString().slice(0, 10),
      category: INTERVIEW_TYPE_LABELS[interview.type] || interview.type,
      title: candidateName ? `${postingTitle} - ${candidateName}` : postingTitle,
      location: interview.location || (interview.meetingLink ? 'Réunion en ligne' : 'Lieu à définir'),
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(interview.scheduledAt),
      avatars: interviewer?.avatarUrl ? [interviewer.avatarUrl] : [],
    };
  });
}

async function getDashboardSummary(tenantId) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = startOfWeek(now);
  const previousWeekStart = addDays(weekStart, -7);
  const monthStart = startOfMonth(now);
  const previousMonthStart = addMonths(monthStart, -1);
  const nextMonthStart = addMonths(monthStart, 1);
  const sixMonthsStart = addMonths(monthStart, -5);
  const reportStart = addDays(weekStart, -28);

  const employeeWhere = { tenantId };
  const attendanceWhere = (from, to) => ({
    employee: { tenantId },
    workDate: { gte: from, lt: to },
  });

  const [
    totalEmployees,
    activeEmployees,
    employeesThisMonth,
    employeesPreviousMonth,
    currentAttendanceRecords,
    previousAttendanceRecords,
    attendanceReportRecords,
    pendingLeaveRequests,
    leaveRequestsThisWeek,
    activeApplications,
    applicationsThisWeek,
    planningInterviews,
    statusGroups,
    feedbacks,
    previousFeedbacks,
    performanceReviews,
    performanceGoals,
  ] = await Promise.all([
    prisma.employee.count({ where: employeeWhere }),
    prisma.employee.count({
      where: {
        ...employeeWhere,
        employmentStatus: {
          in: [EmployeeLifecycleStatus.ACTIVE, EmployeeLifecycleStatus.PROBATION, EmployeeLifecycleStatus.ON_LEAVE],
        },
      },
    }),
    prisma.employee.count({ where: { ...employeeWhere, createdAt: { gte: monthStart, lt: nextMonthStart } } }),
    prisma.employee.count({ where: { ...employeeWhere, createdAt: { gte: previousMonthStart, lt: monthStart } } }),
    prisma.attendanceRecord.findMany({ where: attendanceWhere(weekStart, tomorrowStart), select: { status: true } }),
    prisma.attendanceRecord.findMany({ where: attendanceWhere(previousWeekStart, weekStart), select: { status: true } }),
    prisma.attendanceRecord.findMany({
      where: attendanceWhere(reportStart, tomorrowStart),
      select: { workDate: true, checkInAt: true, status: true },
      orderBy: { workDate: 'asc' },
    }),
    prisma.employeeLeaveRequest.count({
      where: {
        employee: { tenantId },
        status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.IN_REVIEW] },
      },
    }),
    prisma.employeeLeaveRequest.count({
      where: { employee: { tenantId }, appliedAt: { gte: weekStart, lt: tomorrowStart } },
    }),
    prisma.application.count({ where: { tenantId, status: ApplicationStatus.ACTIVE } }),
    prisma.application.count({ where: { tenantId, createdAt: { gte: weekStart, lt: tomorrowStart } } }),
    prisma.interview.findMany({
      where: {
        tenantId,
        status: { not: InterviewStatus.CANCELLED },
        scheduledAt: { gte: monthStart, lt: nextMonthStart },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 100,
      select: {
        id: true,
        type: true,
        scheduledAt: true,
        location: true,
        meetingLink: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true } },
            jobPosting: { select: { title: true } },
          },
        },
        interviewer: { select: { avatarUrl: true } },
      },
    }),
    prisma.employee.groupBy({
      where: employeeWhere,
      by: ['employmentStatus'],
      _count: { _all: true },
    }),
    prisma.performanceFeedback.findMany({
      where: { tenantId, rating: { not: null }, createdAt: { gte: previousMonthStart, lt: nextMonthStart } },
      select: { feedbackType: true, rating: true, createdAt: true },
    }),
    prisma.performanceFeedback.findMany({
      where: { tenantId, rating: { not: null }, createdAt: { gte: addMonths(previousMonthStart, -1), lt: previousMonthStart } },
      select: { rating: true },
    }),
    prisma.performanceReview.findMany({
      where: {
        tenantId,
        status: ReviewStatus.COMPLETED,
        overallScore: { not: null },
        createdAt: { gte: sixMonthsStart, lt: nextMonthStart },
      },
      select: { overallScore: true, createdAt: true },
    }),
    prisma.performanceGoal.findMany({
      where: { tenantId, updatedAt: { gte: sixMonthsStart, lt: nextMonthStart } },
      select: { progressPercent: true, updatedAt: true },
    }),
  ]);

  const attendanceRate = calculateAttendanceRate(currentAttendanceRecords);
  const previousAttendanceRate = calculateAttendanceRate(previousAttendanceRecords);
  const performanceSeries = buildPerformanceSeries(performanceReviews, performanceGoals, now);
  const performanceCurrent = performanceSeries.at(-1)?.value || 0;
  const performancePrevious = performanceSeries.at(-2)?.value || 0;

  return {
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      trend: formatSigned(percentageChange(employeesThisMonth, employeesPreviousMonth), '% vs mois précédent'),
    },
    attendance: {
      rate: attendanceRate,
      trend: formatSigned(percentagePointChange(attendanceRate, previousAttendanceRate), ' pts vs semaine précédente'),
    },
    leaveRequests: {
      pending: pendingLeaveRequests,
      newThisWeek: leaveRequestsThisWeek,
    },
    applications: {
      active: activeApplications,
      newThisWeek: applicationsThisWeek,
    },
    planning: {
      events: serializePlanningEvents(planningInterviews),
      upcomingCount: planningInterviews.length,
    },
    attendanceReport: {
      rate: attendanceRate,
      trend: formatSigned(percentagePointChange(attendanceRate, previousAttendanceRate), ' pts'),
      ...buildAttendanceReport(attendanceReportRecords, weekStart),
    },
    satisfaction: buildSatisfactionData(feedbacks, previousFeedbacks),
    teamPerformance: {
      current: round(performanceCurrent, 1),
      trend: formatSigned(percentagePointChange(performanceCurrent, performancePrevious), ' pts'),
      series: performanceSeries,
    },
    employmentStatus: {
      total: totalEmployees,
      active: activeEmployees,
      data: buildStatusData(statusGroups, totalEmployees),
    },
  };
}

module.exports = {
  getDashboardSummary,
};
