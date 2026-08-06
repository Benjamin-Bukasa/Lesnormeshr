const {
  FeedbackType,
  GoalStatus,
  PerformanceCycleStatus,
  Prisma,
  ReviewStatus,
  ReviewType,
  TrainingStatus,
} = require('@prisma/client');

const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');
const { buildPagination, parsePagination } = require('../utils/pagination');

const PERFORMANCE_CYCLE_STATUSES = Object.values(PerformanceCycleStatus);
const GOAL_STATUSES = Object.values(GoalStatus);
const REVIEW_TYPES = Object.values(ReviewType);
const REVIEW_STATUSES = Object.values(ReviewStatus);
const FEEDBACK_TYPES = Object.values(FeedbackType);
const TRAINING_STATUSES = Object.values(TrainingStatus);

const employeeSummarySelect = {
  id: true,
  employeeNumber: true,
  firstName: true,
  lastName: true,
  preferredName: true,
  workEmail: true,
  employmentStatus: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
    },
  },
};

const cycleSelect = {
  id: true,
  tenantId: true,
  code: true,
  name: true,
  description: true,
  periodStart: true,
  periodEnd: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      goals: true,
      reviews: true,
      feedbacks: true,
      trainings: true,
    },
  },
};

const goalSelect = {
  id: true,
  tenantId: true,
  kpiDefinitionId: true,
  title: true,
  description: true,
  weight: true,
  progressPercent: true,
  targetValue: true,
  achievedValue: true,
  dueDate: true,
  note: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  kpiDefinition: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  cycle: {
    select: cycleSelect,
  },
  employee: {
    select: employeeSummarySelect,
  },
};

const reviewSelect = {
  id: true,
  tenantId: true,
  reviewType: true,
  status: true,
  overallScore: true,
  strengths: true,
  developmentAreas: true,
  comments: true,
  submittedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  cycle: {
    select: cycleSelect,
  },
  reviewee: {
    select: employeeSummarySelect,
  },
  reviewer: {
    select: employeeSummarySelect,
  },
};

const feedbackSelect = {
  id: true,
  tenantId: true,
  feedbackType: true,
  title: true,
  message: true,
  rating: true,
  isAnonymous: true,
  createdAt: true,
  updatedAt: true,
  cycle: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
    },
  },
  author: {
    select: employeeSummarySelect,
  },
  receiver: {
    select: employeeSummarySelect,
  },
};

const trainingSelect = {
  id: true,
  tenantId: true,
  title: true,
  provider: true,
  startDate: true,
  endDate: true,
  status: true,
  hours: true,
  score: true,
  certificateUrl: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  cycle: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
    },
  },
  employee: {
    select: employeeSummarySelect,
  },
};

const kpiDefinitionSelect = {
  id: true,
  tenantId: true,
  code: true,
  name: true,
  scope: true,
  directionName: true,
  metricType: true,
  unit: true,
  defaultWeight: true,
  ownerLabel: true,
  status: true,
  description: true,
  managerEmployee: {
    select: employeeSummarySelect,
  },
  createdAt: true,
  updatedAt: true,
};

const kpiAssignmentSelect = {
  id: true,
  tenantId: true,
  summary: true,
  assignedKpis: true,
  totalWeight: true,
  completionPercent: true,
  riskLevel: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  cycle: {
    select: cycleSelect,
  },
  employee: {
    select: employeeSummarySelect,
  },
  managerEmployee: {
    select: employeeSummarySelect,
  },
};

const kpiCheckInSelect = {
  id: true,
  tenantId: true,
  title: true,
  checkInDate: true,
  progressPercent: true,
  blocker: true,
  supportNeeded: true,
  nextActions: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  goal: {
    select: goalSelect,
  },
};

function normalizeSearch(value) {
  return String(value || '').trim();
}

function buildContains(value) {
  const search = normalizeSearch(value);

  if (!search) {
    return undefined;
  }

  return {
    contains: search,
    mode: 'insensitive',
  };
}

function toDisplayName(person) {
  if (!person) {
    return null;
  }

  return [person.preferredName || person.firstName, person.lastName].filter(Boolean).join(' ').trim();
}

function decimalToNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value instanceof Prisma.Decimal) {
    return Number(value.toString());
  }

  return Number(value);
}

function parseDateField(value, fieldName, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(400, `Le champ ${fieldName} est obligatoire.`);
    }

    return undefined;
  }

  const normalizedDate = new Date(value);

  if (Number.isNaN(normalizedDate.getTime())) {
    throw new AppError(400, `Le champ ${fieldName} doit etre une date valide.`);
  }

  return normalizedDate;
}

function parseDecimalField(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    throw new AppError(400, `Le champ ${fieldName} doit etre numerique.`);
  }

  return normalized;
}

function normalizeEnum(value, enumValues, fieldName, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(400, `Le champ ${fieldName} est obligatoire.`);
    }

    return undefined;
  }

  const normalized = String(value).trim().toUpperCase();

  if (!enumValues.includes(normalized)) {
    throw new AppError(400, `Le champ ${fieldName} est invalide.`);
  }

  return normalized;
}

function tenantUserFilter(tenantId) {
  return {
    is: {
      tenantId,
    },
  };
}

function tenantEmployeeFilter(tenantId) {
  return {
    is: {
      user: tenantUserFilter(tenantId),
    },
  };
}

function serializeCycle(cycle) {
  return {
    id: cycle.id,
    tenantId: cycle.tenantId,
    code: cycle.code,
    name: cycle.name,
    description: cycle.description,
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
    status: cycle.status,
    createdAt: cycle.createdAt,
    updatedAt: cycle.updatedAt,
    counts: cycle._count,
  };
}

function serializeEmployeeSummary(employee) {
  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    fullName: toDisplayName(employee),
    workEmail: employee.workEmail,
    employmentStatus: employee.employmentStatus,
    department: employee.department
      ? {
          id: employee.department.id,
          name: employee.department.name,
        }
      : null,
    manager: employee.manager
      ? {
          id: employee.manager.id,
          fullName: toDisplayName(employee.manager),
        }
      : null,
  };
}

function serializeGoal(goal) {
  return {
    id: goal.id,
    tenantId: goal.tenantId,
    kpiDefinitionId: goal.kpiDefinitionId,
    title: goal.title,
    description: goal.description,
    weight: decimalToNumber(goal.weight),
    progressPercent: decimalToNumber(goal.progressPercent),
    targetValue: goal.targetValue,
    achievedValue: goal.achievedValue,
    dueDate: goal.dueDate,
    note: goal.note,
    status: goal.status,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    kpiDefinition: goal.kpiDefinition
      ? {
          id: goal.kpiDefinition.id,
          code: goal.kpiDefinition.code,
          name: goal.kpiDefinition.name,
        }
      : null,
    cycle: goal.cycle ? serializeCycle(goal.cycle) : null,
    employee: goal.employee ? serializeEmployeeSummary(goal.employee) : null,
  };
}

function serializeReview(review) {
  return {
    id: review.id,
    tenantId: review.tenantId,
    reviewType: review.reviewType,
    status: review.status,
    overallScore: decimalToNumber(review.overallScore),
    strengths: review.strengths,
    developmentAreas: review.developmentAreas,
    comments: review.comments,
    submittedAt: review.submittedAt,
    completedAt: review.completedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    cycle: review.cycle ? serializeCycle(review.cycle) : null,
    reviewee: review.reviewee ? serializeEmployeeSummary(review.reviewee) : null,
    reviewer: review.reviewer ? serializeEmployeeSummary(review.reviewer) : null,
  };
}

function serializeFeedback(feedback) {
  return {
    id: feedback.id,
    tenantId: feedback.tenantId,
    feedbackType: feedback.feedbackType,
    title: feedback.title,
    message: feedback.message,
    rating: decimalToNumber(feedback.rating),
    isAnonymous: feedback.isAnonymous,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    cycle: feedback.cycle,
    author: feedback.author ? serializeEmployeeSummary(feedback.author) : null,
    receiver: feedback.receiver ? serializeEmployeeSummary(feedback.receiver) : null,
  };
}

function serializeTraining(training) {
  return {
    id: training.id,
    tenantId: training.tenantId,
    title: training.title,
    provider: training.provider,
    startDate: training.startDate,
    endDate: training.endDate,
    status: training.status,
    hours: decimalToNumber(training.hours),
    score: decimalToNumber(training.score),
    certificateUrl: training.certificateUrl,
    notes: training.notes,
    createdAt: training.createdAt,
    updatedAt: training.updatedAt,
    cycle: training.cycle,
    employee: training.employee ? serializeEmployeeSummary(training.employee) : null,
  };
}

function serializeKpiDefinition(definition) {
  return {
    id: definition.id,
    tenantId: definition.tenantId,
    code: definition.code,
    name: definition.name,
    scope: definition.scope,
    directionName: definition.directionName,
    metricType: definition.metricType,
    unit: definition.unit,
    defaultWeight: decimalToNumber(definition.defaultWeight),
    ownerLabel: definition.ownerLabel,
    status: definition.status,
    description: definition.description,
    managerEmployee: definition.managerEmployee ? serializeEmployeeSummary(definition.managerEmployee) : null,
    createdAt: definition.createdAt,
    updatedAt: definition.updatedAt,
  };
}

function serializeKpiAssignment(assignment) {
  return {
    id: assignment.id,
    tenantId: assignment.tenantId,
    summary: assignment.summary,
    assignedKpis: assignment.assignedKpis,
    totalWeight: decimalToNumber(assignment.totalWeight),
    completionPercent: decimalToNumber(assignment.completionPercent),
    riskLevel: assignment.riskLevel,
    status: assignment.status,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    cycle: assignment.cycle ? serializeCycle(assignment.cycle) : null,
    employee: assignment.employee ? serializeEmployeeSummary(assignment.employee) : null,
    managerEmployee: assignment.managerEmployee ? serializeEmployeeSummary(assignment.managerEmployee) : null,
  };
}

function serializeKpiCheckIn(checkIn) {
  return {
    id: checkIn.id,
    tenantId: checkIn.tenantId,
    title: checkIn.title,
    checkInDate: checkIn.checkInDate,
    progressPercent: decimalToNumber(checkIn.progressPercent),
    blocker: checkIn.blocker,
    supportNeeded: checkIn.supportNeeded,
    nextActions: checkIn.nextActions,
    status: checkIn.status,
    createdAt: checkIn.createdAt,
    updatedAt: checkIn.updatedAt,
    goal: checkIn.goal ? serializeGoal(checkIn.goal) : null,
  };
}

async function ensureEmployeeInTenant(employeeId, tenantId, fieldName = 'employeeId') {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      user: tenantUserFilter(tenantId),
    },
    select: {
      id: true,
    },
  });

  if (!employee) {
    throw new AppError(404, `Le collaborateur reference par ${fieldName} est introuvable pour ce tenant.`);
  }
}

async function ensureCycleExists(cycleId, tenantId) {
  const cycle = await prisma.performanceCycle.findFirst({
    where: {
      id: cycleId,
      tenantId,
    },
    select: { id: true },
  });

  if (!cycle) {
    throw new AppError(404, 'La campagne de performance est introuvable pour ce tenant.');
  }
}

async function ensureKpiDefinitionExists(kpiDefinitionId, tenantId) {
  const definition = await prisma.kpiDefinition.findFirst({
    where: {
      id: kpiDefinitionId,
      tenantId,
    },
    select: { id: true },
  });

  if (!definition) {
    throw new AppError(404, 'Le KPI reference est introuvable pour ce tenant.');
  }
}

async function ensureGoalExists(goalId, tenantId) {
  const goal = await prisma.performanceGoal.findFirst({
    where: {
      id: goalId,
      tenantId,
    },
    select: { id: true },
  });

  if (!goal) {
    throw new AppError(404, 'L objectif reference est introuvable pour ce tenant.');
  }
}

function buildScoreBands(reviews) {
  return reviews.reduce(
    (accumulator, review) => {
      const score = decimalToNumber(review.overallScore);

      if (score === null || Number.isNaN(score)) {
        accumulator.UNRATED += 1;
        return accumulator;
      }

      if (score >= 90) {
        accumulator.A += 1;
      } else if (score >= 80) {
        accumulator.B += 1;
      } else if (score >= 65) {
        accumulator.C += 1;
      } else if (score >= 50) {
        accumulator.D += 1;
      } else {
        accumulator.E += 1;
      }

      return accumulator;
    },
    { A: 0, B: 0, C: 0, D: 0, E: 0, UNRATED: 0 },
  );
}

async function getPerformanceDashboard(tenantId) {
  const goalWhere = {
    tenantId,
  };
  const reviewWhere = {
    tenantId,
  };
  const trainingWhere = {
    tenantId,
  };
  const feedbackWhere = {
    tenantId,
  };

  const [
    activeCyclesCount,
    draftCyclesCount,
    totalGoalsCount,
    atRiskGoalsCount,
    completedGoalsCount,
    pendingReviewsCount,
    completedReviewsCount,
    plannedTrainingsCount,
    activeTrainingsCount,
    feedbackCount,
    scoredReviews,
  ] = await Promise.all([
    prisma.performanceCycle.count({
      where: {
        tenantId,
        status: PerformanceCycleStatus.ACTIVE,
      },
    }),
    prisma.performanceCycle.count({
      where: {
        tenantId,
        status: PerformanceCycleStatus.DRAFT,
      },
    }),
    prisma.performanceGoal.count({ where: goalWhere }),
    prisma.performanceGoal.count({
      where: {
        ...goalWhere,
        status: {
          in: [GoalStatus.ON_HOLD, GoalStatus.NOT_STARTED],
        },
      },
    }),
    prisma.performanceGoal.count({
      where: {
        ...goalWhere,
        status: GoalStatus.COMPLETED,
      },
    }),
    prisma.performanceReview.count({
      where: {
        ...reviewWhere,
        status: {
          in: [ReviewStatus.DRAFT, ReviewStatus.SUBMITTED],
        },
      },
    }),
    prisma.performanceReview.count({
      where: {
        ...reviewWhere,
        status: ReviewStatus.COMPLETED,
      },
    }),
    prisma.employeeTraining.count({
      where: {
        ...trainingWhere,
        status: TrainingStatus.PLANNED,
      },
    }),
    prisma.employeeTraining.count({
      where: {
        ...trainingWhere,
        status: TrainingStatus.IN_PROGRESS,
      },
    }),
    prisma.performanceFeedback.count({
      where: feedbackWhere,
    }),
    prisma.performanceReview.findMany({
      where: reviewWhere,
      select: {
        overallScore: true,
      },
    }),
  ]);

  const ratedScores = scoredReviews
    .map((review) => decimalToNumber(review.overallScore))
    .filter((value) => Number.isFinite(value));

  return {
    summary: {
      activeCyclesCount,
      draftCyclesCount,
      totalGoalsCount,
      atRiskGoalsCount,
      completedGoalsCount,
      pendingReviewsCount,
      completedReviewsCount,
      plannedTrainingsCount,
      activeTrainingsCount,
      feedbackCount,
      averageReviewScore: ratedScores.length
        ? Math.round(ratedScores.reduce((sum, value) => sum + value, 0) / ratedScores.length)
        : 0,
    },
    scoreBands: buildScoreBands(scoredReviews),
  };
}

async function getPerformanceOptions(tenantId) {
  const [cycles, employees] = await Promise.all([
    prisma.performanceCycle.findMany({
      where: {
        tenantId,
      },
      orderBy: [{ periodStart: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
      },
      take: 100,
    }),
    prisma.employee.findMany({
      where: {
        user: tenantUserFilter(tenantId),
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: employeeSummarySelect,
      take: 300,
    }),
  ]);

  const directionsMap = new Map();
  const managersMap = new Map();

  employees.forEach((employee) => {
    if (employee.department?.id && employee.department?.name) {
      directionsMap.set(employee.department.id, {
        value: employee.department.id,
        label: employee.department.name,
      });
    }

    if (employee.manager?.id) {
      managersMap.set(employee.manager.id, {
        value: employee.manager.id,
        label: toDisplayName(employee.manager),
      });
    }
  });

  return {
    cycles: cycles.map((cycle) => ({
      value: cycle.id,
      label: `${cycle.code} - ${cycle.name}`,
      status: cycle.status,
    })),
    employees: employees.map((employee) => ({
      value: employee.id,
      label: toDisplayName(employee),
      employeeNumber: employee.employeeNumber,
      departmentName: employee.department?.name || null,
    })),
    managers: Array.from(managersMap.values()),
    directions: Array.from(directionsMap.values()),
    reviewTypes: REVIEW_TYPES.map((value) => ({ value, label: value })),
    goalStatuses: GOAL_STATUSES.map((value) => ({ value, label: value })),
    reviewStatuses: REVIEW_STATUSES.map((value) => ({ value, label: value })),
    trainingStatuses: TRAINING_STATUSES.map((value) => ({ value, label: value })),
    feedbackTypes: FEEDBACK_TYPES.map((value) => ({ value, label: value })),
  };
}

async function listCycles(query, tenantId) {
  const pagination = parsePagination(query);
  const status = normalizeEnum(query.status, PERFORMANCE_CYCLE_STATUSES, 'status');
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(status ? { status } : {}),
    ...(searchFilter
      ? {
          OR: [
            { code: searchFilter },
            { name: searchFilter },
            { description: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.performanceCycle.findMany({
      where,
      orderBy: [{ periodStart: 'desc' }, { name: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: cycleSelect,
    }),
    prisma.performanceCycle.count({ where }),
  ]);

  return {
    items: items.map(serializeCycle),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createCycle(payload, tenantId) {
  const code = String(payload.code || '').trim();
  const name = String(payload.name || '').trim();

  if (!code) {
    throw new AppError(400, 'Le code de campagne est obligatoire.');
  }

  if (!name) {
    throw new AppError(400, 'Le nom de campagne est obligatoire.');
  }

  const periodStart = parseDateField(payload.periodStart, 'periodStart', true);
  const periodEnd = parseDateField(payload.periodEnd, 'periodEnd', true);

  if (periodEnd < periodStart) {
    throw new AppError(400, 'La date de fin doit etre posterieure a la date de debut.');
  }

  const status = normalizeEnum(payload.status, PERFORMANCE_CYCLE_STATUSES, 'status') || PerformanceCycleStatus.DRAFT;

  const created = await prisma.performanceCycle.create({
    data: {
      tenantId,
      code,
      name,
      description: payload.description ? String(payload.description).trim() : null,
      periodStart,
      periodEnd,
      status,
    },
    select: cycleSelect,
  });

  return serializeCycle(created);
}

async function updateCycle(cycleId, payload, tenantId) {
  const existing = await prisma.performanceCycle.findFirst({
    where: {
      id: cycleId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Campagne de performance introuvable.');
  }

  const data = {};

  if (payload.code !== undefined) {
    const code = String(payload.code || '').trim();
    if (!code) {
      throw new AppError(400, 'Le code de campagne ne peut pas etre vide.');
    }
    data.code = code;
  }

  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim();
    if (!name) {
      throw new AppError(400, 'Le nom de campagne ne peut pas etre vide.');
    }
    data.name = name;
  }

  if (payload.description !== undefined) {
    data.description = payload.description ? String(payload.description).trim() : null;
  }

  if (payload.periodStart !== undefined) {
    data.periodStart = parseDateField(payload.periodStart, 'periodStart', true);
  }

  if (payload.periodEnd !== undefined) {
    data.periodEnd = parseDateField(payload.periodEnd, 'periodEnd', true);
  }

  if (payload.status !== undefined) {
    data.status = normalizeEnum(payload.status, PERFORMANCE_CYCLE_STATUSES, 'status', true);
  }

  const updated = await prisma.performanceCycle.update({
    where: { id: cycleId },
    data,
    select: cycleSelect,
  });

  return serializeCycle(updated);
}

async function deleteCycle(cycleId, tenantId) {
  const existing = await prisma.performanceCycle.findFirst({
    where: {
      id: cycleId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Campagne de performance introuvable.');
  }

  const goals = await prisma.performanceGoal.findMany({
    where: {
      cycleId,
      tenantId,
    },
    select: { id: true },
  });

  const goalIds = goals.map((goal) => goal.id);

  await prisma.$transaction([
    prisma.kpiCheckIn.deleteMany({
      where: {
        goalId: {
          in: goalIds,
        },
      },
    }),
    prisma.performanceGoal.deleteMany({
      where: {
        cycleId,
        tenantId,
      },
    }),
    prisma.performanceReview.deleteMany({
      where: {
        cycleId,
        tenantId,
      },
    }),
    prisma.performanceFeedback.deleteMany({
      where: {
        cycleId,
        tenantId,
      },
    }),
    prisma.employeeTraining.deleteMany({
      where: {
        cycleId,
        tenantId,
      },
    }),
    prisma.kpiAssignment.deleteMany({
      where: {
        cycleId,
        tenantId,
      },
    }),
    prisma.performanceCycle.delete({
      where: { id: cycleId },
    }),
  ]);

  return { id: cycleId };
}

async function listGoals(query, tenantId) {
  const pagination = parsePagination(query);
  const status = normalizeEnum(query.status, GOAL_STATUSES, 'status');
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(query.cycleId ? { cycleId: String(query.cycleId) } : {}),
    ...(query.employeeId ? { employeeId: String(query.employeeId) } : {}),
    ...(status ? { status } : {}),
    ...(searchFilter
      ? {
          OR: [
            { title: searchFilter },
            { description: searchFilter },
            { targetValue: searchFilter },
            { achievedValue: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.performanceGoal.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: goalSelect,
    }),
    prisma.performanceGoal.count({ where }),
  ]);

  return {
    items: items.map(serializeGoal),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createGoal(payload, tenantId) {
  const employeeId = String(payload.employeeId || '').trim();
  const cycleId = String(payload.cycleId || '').trim();
  const title = String(payload.title || '').trim();

  if (!employeeId || !cycleId || !title) {
    throw new AppError(400, 'Les champs employeeId, cycleId et title sont obligatoires.');
  }

  await Promise.all([
    ensureEmployeeInTenant(employeeId, tenantId, 'employeeId'),
    ensureCycleExists(cycleId, tenantId),
  ]);

  if (payload.kpiDefinitionId) {
    await ensureKpiDefinitionExists(String(payload.kpiDefinitionId), tenantId);
  }

  const status = normalizeEnum(payload.status, GOAL_STATUSES, 'status') || GoalStatus.NOT_STARTED;

  const created = await prisma.performanceGoal.create({
    data: {
      tenantId,
      employeeId,
      cycleId,
      kpiDefinitionId: payload.kpiDefinitionId ? String(payload.kpiDefinitionId).trim() : null,
      title,
      description: payload.description ? String(payload.description).trim() : null,
      weight: parseDecimalField(payload.weight, 'weight'),
      progressPercent: parseDecimalField(payload.progressPercent, 'progressPercent') ?? 0,
      targetValue: payload.targetValue ? String(payload.targetValue).trim() : null,
      achievedValue: payload.achievedValue ? String(payload.achievedValue).trim() : null,
      dueDate: parseDateField(payload.dueDate, 'dueDate'),
      note: payload.note ? String(payload.note).trim() : null,
      status,
    },
    select: goalSelect,
  });

  return serializeGoal(created);
}

async function updateGoal(goalId, payload, tenantId) {
  const existing = await prisma.performanceGoal.findFirst({
    where: {
      id: goalId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Objectif de performance introuvable.');
  }

  const data = {};

  if (payload.title !== undefined) {
    const title = String(payload.title || '').trim();
    if (!title) {
      throw new AppError(400, 'Le titre de l objectif ne peut pas etre vide.');
    }
    data.title = title;
  }

  if (payload.description !== undefined) {
    data.description = payload.description ? String(payload.description).trim() : null;
  }

  if (payload.weight !== undefined) {
    data.weight = parseDecimalField(payload.weight, 'weight');
  }

  if (payload.progressPercent !== undefined) {
    data.progressPercent = parseDecimalField(payload.progressPercent, 'progressPercent');
  }

  if (payload.targetValue !== undefined) {
    data.targetValue = payload.targetValue ? String(payload.targetValue).trim() : null;
  }

  if (payload.achievedValue !== undefined) {
    data.achievedValue = payload.achievedValue ? String(payload.achievedValue).trim() : null;
  }

  if (payload.dueDate !== undefined) {
    data.dueDate = parseDateField(payload.dueDate, 'dueDate') || null;
  }

  if (payload.note !== undefined) {
    data.note = payload.note ? String(payload.note).trim() : null;
  }

  if (payload.status !== undefined) {
    data.status = normalizeEnum(payload.status, GOAL_STATUSES, 'status', true);
  }

  if (payload.employeeId !== undefined) {
    await ensureEmployeeInTenant(String(payload.employeeId), tenantId, 'employeeId');
    data.employeeId = String(payload.employeeId);
  }

  if (payload.cycleId !== undefined) {
    await ensureCycleExists(String(payload.cycleId), tenantId);
    data.cycleId = String(payload.cycleId);
  }

  if (payload.kpiDefinitionId !== undefined) {
    if (payload.kpiDefinitionId) {
      await ensureKpiDefinitionExists(String(payload.kpiDefinitionId), tenantId);
      data.kpiDefinitionId = String(payload.kpiDefinitionId);
    } else {
      data.kpiDefinitionId = null;
    }
  }

  const updated = await prisma.performanceGoal.update({
    where: { id: goalId },
    data,
    select: goalSelect,
  });

  return serializeGoal(updated);
}

async function deleteGoal(goalId, tenantId) {
  const existing = await prisma.performanceGoal.findFirst({
    where: {
      id: goalId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Objectif de performance introuvable.');
  }

  await prisma.$transaction([
    prisma.kpiCheckIn.deleteMany({
      where: {
        goalId,
        tenantId,
      },
    }),
    prisma.performanceGoal.delete({
      where: { id: goalId },
    }),
  ]);

  return { id: goalId };
}

async function listReviews(query, tenantId) {
  const pagination = parsePagination(query);
  const reviewType = normalizeEnum(query.reviewType, REVIEW_TYPES, 'reviewType');
  const status = normalizeEnum(query.status, REVIEW_STATUSES, 'status');
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(query.cycleId ? { cycleId: String(query.cycleId) } : {}),
    ...(query.revieweeEmployeeId ? { revieweeEmployeeId: String(query.revieweeEmployeeId) } : {}),
    ...(query.reviewerEmployeeId ? { reviewerEmployeeId: String(query.reviewerEmployeeId) } : {}),
    ...(reviewType ? { reviewType } : {}),
    ...(status ? { status } : {}),
    ...(searchFilter
      ? {
          OR: [
            { comments: searchFilter },
            { strengths: searchFilter },
            { developmentAreas: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.performanceReview.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: reviewSelect,
    }),
    prisma.performanceReview.count({ where }),
  ]);

  return {
    items: items.map(serializeReview),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createReview(payload, tenantId) {
  const cycleId = String(payload.cycleId || '').trim();
  const revieweeEmployeeId = String(payload.revieweeEmployeeId || '').trim();
  const reviewerEmployeeId = String(payload.reviewerEmployeeId || '').trim();
  const reviewType = normalizeEnum(payload.reviewType, REVIEW_TYPES, 'reviewType', true);

  if (!cycleId || !revieweeEmployeeId || !reviewerEmployeeId) {
    throw new AppError(400, 'Les champs cycleId, revieweeEmployeeId et reviewerEmployeeId sont obligatoires.');
  }

  await Promise.all([
    ensureCycleExists(cycleId, tenantId),
    ensureEmployeeInTenant(revieweeEmployeeId, tenantId, 'revieweeEmployeeId'),
    ensureEmployeeInTenant(reviewerEmployeeId, tenantId, 'reviewerEmployeeId'),
  ]);

  const status = normalizeEnum(payload.status, REVIEW_STATUSES, 'status') || ReviewStatus.DRAFT;

  const created = await prisma.performanceReview.create({
    data: {
      tenantId,
      cycleId,
      revieweeEmployeeId,
      reviewerEmployeeId,
      reviewType,
      status,
      overallScore: parseDecimalField(payload.overallScore, 'overallScore'),
      strengths: payload.strengths ? String(payload.strengths).trim() : null,
      developmentAreas: payload.developmentAreas ? String(payload.developmentAreas).trim() : null,
      comments: payload.comments ? String(payload.comments).trim() : null,
      submittedAt: parseDateField(payload.submittedAt, 'submittedAt'),
      completedAt: parseDateField(payload.completedAt, 'completedAt'),
    },
    select: reviewSelect,
  });

  return serializeReview(created);
}

async function updateReview(reviewId, payload, tenantId) {
  const existing = await prisma.performanceReview.findFirst({
    where: {
      id: reviewId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Evaluation de performance introuvable.');
  }

  const data = {};

  if (payload.cycleId !== undefined) {
    await ensureCycleExists(String(payload.cycleId), tenantId);
    data.cycleId = String(payload.cycleId);
  }

  if (payload.revieweeEmployeeId !== undefined) {
    await ensureEmployeeInTenant(String(payload.revieweeEmployeeId), tenantId, 'revieweeEmployeeId');
    data.revieweeEmployeeId = String(payload.revieweeEmployeeId);
  }

  if (payload.reviewerEmployeeId !== undefined) {
    await ensureEmployeeInTenant(String(payload.reviewerEmployeeId), tenantId, 'reviewerEmployeeId');
    data.reviewerEmployeeId = String(payload.reviewerEmployeeId);
  }

  if (payload.reviewType !== undefined) {
    data.reviewType = normalizeEnum(payload.reviewType, REVIEW_TYPES, 'reviewType', true);
  }

  if (payload.status !== undefined) {
    data.status = normalizeEnum(payload.status, REVIEW_STATUSES, 'status', true);
  }

  if (payload.overallScore !== undefined) {
    data.overallScore = parseDecimalField(payload.overallScore, 'overallScore');
  }

  if (payload.strengths !== undefined) {
    data.strengths = payload.strengths ? String(payload.strengths).trim() : null;
  }

  if (payload.developmentAreas !== undefined) {
    data.developmentAreas = payload.developmentAreas ? String(payload.developmentAreas).trim() : null;
  }

  if (payload.comments !== undefined) {
    data.comments = payload.comments ? String(payload.comments).trim() : null;
  }

  if (payload.submittedAt !== undefined) {
    data.submittedAt = parseDateField(payload.submittedAt, 'submittedAt') || null;
  }

  if (payload.completedAt !== undefined) {
    data.completedAt = parseDateField(payload.completedAt, 'completedAt') || null;
  }

  const updated = await prisma.performanceReview.update({
    where: { id: reviewId },
    data,
    select: reviewSelect,
  });

  return serializeReview(updated);
}

async function deleteReview(reviewId, tenantId) {
  const existing = await prisma.performanceReview.findFirst({
    where: {
      id: reviewId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Evaluation de performance introuvable.');
  }

  await prisma.performanceReview.delete({
    where: { id: reviewId },
  });

  return { id: reviewId };
}

async function listFeedbacks(query, tenantId) {
  const pagination = parsePagination(query);
  const feedbackType = normalizeEnum(query.feedbackType, FEEDBACK_TYPES, 'feedbackType');
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(query.cycleId ? { cycleId: String(query.cycleId) } : {}),
    ...(query.toEmployeeId ? { toEmployeeId: String(query.toEmployeeId) } : {}),
    ...(feedbackType ? { feedbackType } : {}),
    ...(searchFilter
      ? {
          OR: [
            { title: searchFilter },
            { message: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.performanceFeedback.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: feedbackSelect,
    }),
    prisma.performanceFeedback.count({ where }),
  ]);

  return {
    items: items.map(serializeFeedback),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createFeedback(payload, tenantId) {
  const toEmployeeId = String(payload.toEmployeeId || '').trim();

  if (!toEmployeeId) {
    throw new AppError(400, 'Le champ toEmployeeId est obligatoire.');
  }

  await ensureEmployeeInTenant(toEmployeeId, tenantId, 'toEmployeeId');

  if (payload.fromEmployeeId) {
    await ensureEmployeeInTenant(String(payload.fromEmployeeId), tenantId, 'fromEmployeeId');
  }

  if (payload.cycleId) {
    await ensureCycleExists(String(payload.cycleId), tenantId);
  }

  const feedbackType = normalizeEnum(payload.feedbackType, FEEDBACK_TYPES, 'feedbackType', true);
  const message = String(payload.message || '').trim();

  if (!message) {
    throw new AppError(400, 'Le message de feedback est obligatoire.');
  }

  const created = await prisma.performanceFeedback.create({
    data: {
      tenantId,
      cycleId: payload.cycleId ? String(payload.cycleId).trim() : null,
      fromEmployeeId: payload.fromEmployeeId ? String(payload.fromEmployeeId).trim() : null,
      toEmployeeId,
      feedbackType,
      title: payload.title ? String(payload.title).trim() : null,
      message,
      rating: parseDecimalField(payload.rating, 'rating'),
      isAnonymous: Boolean(payload.isAnonymous),
    },
    select: feedbackSelect,
  });

  return serializeFeedback(created);
}

async function listTrainings(query, tenantId) {
  const pagination = parsePagination(query);
  const status = normalizeEnum(query.status, TRAINING_STATUSES, 'status');
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(query.cycleId ? { cycleId: String(query.cycleId) } : {}),
    ...(query.employeeId ? { employeeId: String(query.employeeId) } : {}),
    ...(status ? { status } : {}),
    ...(searchFilter
      ? {
          OR: [
            { title: searchFilter },
            { provider: searchFilter },
            { notes: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.employeeTraining.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: trainingSelect,
    }),
    prisma.employeeTraining.count({ where }),
  ]);

  return {
    items: items.map(serializeTraining),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createTraining(payload, tenantId) {
  const employeeId = String(payload.employeeId || '').trim();
  const title = String(payload.title || '').trim();

  if (!employeeId || !title) {
    throw new AppError(400, 'Les champs employeeId et title sont obligatoires.');
  }

  await ensureEmployeeInTenant(employeeId, tenantId, 'employeeId');

  if (payload.cycleId) {
    await ensureCycleExists(String(payload.cycleId), tenantId);
  }

  const status = normalizeEnum(payload.status, TRAINING_STATUSES, 'status') || TrainingStatus.PLANNED;

  const created = await prisma.employeeTraining.create({
    data: {
      tenantId,
      employeeId,
      cycleId: payload.cycleId ? String(payload.cycleId).trim() : null,
      title,
      provider: payload.provider ? String(payload.provider).trim() : null,
      startDate: parseDateField(payload.startDate, 'startDate'),
      endDate: parseDateField(payload.endDate, 'endDate'),
      status,
      hours: parseDecimalField(payload.hours, 'hours'),
      score: parseDecimalField(payload.score, 'score'),
      certificateUrl: payload.certificateUrl ? String(payload.certificateUrl).trim() : null,
      notes: payload.notes ? String(payload.notes).trim() : null,
    },
    select: trainingSelect,
  });

  return serializeTraining(created);
}

async function updateTraining(trainingId, payload, tenantId) {
  const existing = await prisma.employeeTraining.findFirst({
    where: {
      id: trainingId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Action de developpement introuvable.');
  }

  const data = {};

  if (payload.employeeId !== undefined) {
    await ensureEmployeeInTenant(String(payload.employeeId), tenantId, 'employeeId');
    data.employeeId = String(payload.employeeId);
  }

  if (payload.cycleId !== undefined) {
    if (payload.cycleId) {
    await ensureCycleExists(String(payload.cycleId), tenantId);
      data.cycleId = String(payload.cycleId);
    } else {
      data.cycleId = null;
    }
  }

  if (payload.title !== undefined) {
    const title = String(payload.title || '').trim();
    if (!title) {
      throw new AppError(400, 'Le titre de la formation ne peut pas etre vide.');
    }
    data.title = title;
  }

  if (payload.provider !== undefined) {
    data.provider = payload.provider ? String(payload.provider).trim() : null;
  }

  if (payload.startDate !== undefined) {
    data.startDate = parseDateField(payload.startDate, 'startDate') || null;
  }

  if (payload.endDate !== undefined) {
    data.endDate = parseDateField(payload.endDate, 'endDate') || null;
  }

  if (payload.status !== undefined) {
    data.status = normalizeEnum(payload.status, TRAINING_STATUSES, 'status', true);
  }

  if (payload.hours !== undefined) {
    data.hours = parseDecimalField(payload.hours, 'hours');
  }

  if (payload.score !== undefined) {
    data.score = parseDecimalField(payload.score, 'score');
  }

  if (payload.certificateUrl !== undefined) {
    data.certificateUrl = payload.certificateUrl ? String(payload.certificateUrl).trim() : null;
  }

  if (payload.notes !== undefined) {
    data.notes = payload.notes ? String(payload.notes).trim() : null;
  }

  const updated = await prisma.employeeTraining.update({
    where: { id: trainingId },
    data,
    select: trainingSelect,
  });

  return serializeTraining(updated);
}

async function deleteTraining(trainingId, tenantId) {
  const existing = await prisma.employeeTraining.findFirst({
    where: {
      id: trainingId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Action de developpement introuvable.');
  }

  await prisma.employeeTraining.delete({
    where: { id: trainingId },
  });

  return { id: trainingId };
}

async function listKpiDefinitions(query, tenantId) {
  const pagination = parsePagination(query);
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(query.status ? { status: String(query.status) } : {}),
    ...(searchFilter
      ? {
          OR: [
            { code: searchFilter },
            { name: searchFilter },
            { description: searchFilter },
            { ownerLabel: searchFilter },
            { directionName: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.kpiDefinition.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: kpiDefinitionSelect,
    }),
    prisma.kpiDefinition.count({ where }),
  ]);

  return {
    items: items.map(serializeKpiDefinition),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createKpiDefinition(payload, tenantId) {
  const code = String(payload.code || '').trim();
  const name = String(payload.name || '').trim();
  const scope = String(payload.scope || '').trim();
  const metricType = String(payload.metricType || '').trim();

  if (!code || !name || !scope || !metricType) {
    throw new AppError(400, 'Les champs code, name, scope et metricType sont obligatoires.');
  }

  if (payload.managerEmployeeId) {
    await ensureEmployeeInTenant(String(payload.managerEmployeeId), tenantId, 'managerEmployeeId');
  }

  const created = await prisma.kpiDefinition.create({
    data: {
      tenantId,
      code,
      name,
      scope,
      directionName: payload.directionName ? String(payload.directionName).trim() : null,
      metricType,
      unit: payload.unit ? String(payload.unit).trim() : null,
      defaultWeight: parseDecimalField(payload.defaultWeight, 'defaultWeight'),
      ownerLabel: payload.ownerLabel ? String(payload.ownerLabel).trim() : null,
      status: payload.status ? String(payload.status).trim() : 'Draft',
      description: payload.description ? String(payload.description).trim() : null,
      managerEmployeeId: payload.managerEmployeeId ? String(payload.managerEmployeeId).trim() : null,
    },
    select: kpiDefinitionSelect,
  });

  return serializeKpiDefinition(created);
}

async function updateKpiDefinition(kpiDefinitionId, payload, tenantId) {
  const existing = await prisma.kpiDefinition.findFirst({
    where: {
      id: kpiDefinitionId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'KPI introuvable.');
  }

  const data = {};

  if (payload.code !== undefined) {
    const code = String(payload.code || '').trim();
    if (!code) {
      throw new AppError(400, 'Le code du KPI ne peut pas etre vide.');
    }
    data.code = code;
  }

  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim();
    if (!name) {
      throw new AppError(400, 'Le nom du KPI ne peut pas etre vide.');
    }
    data.name = name;
  }

  if (payload.scope !== undefined) {
    const scope = String(payload.scope || '').trim();
    if (!scope) {
      throw new AppError(400, 'Le scope du KPI ne peut pas etre vide.');
    }
    data.scope = scope;
  }

  if (payload.directionName !== undefined) {
    data.directionName = payload.directionName ? String(payload.directionName).trim() : null;
  }

  if (payload.metricType !== undefined) {
    const metricType = String(payload.metricType || '').trim();
    if (!metricType) {
      throw new AppError(400, 'Le type de mesure ne peut pas etre vide.');
    }
    data.metricType = metricType;
  }

  if (payload.unit !== undefined) {
    data.unit = payload.unit ? String(payload.unit).trim() : null;
  }

  if (payload.defaultWeight !== undefined) {
    data.defaultWeight = parseDecimalField(payload.defaultWeight, 'defaultWeight');
  }

  if (payload.ownerLabel !== undefined) {
    data.ownerLabel = payload.ownerLabel ? String(payload.ownerLabel).trim() : null;
  }

  if (payload.status !== undefined) {
    data.status = payload.status ? String(payload.status).trim() : null;
  }

  if (payload.description !== undefined) {
    data.description = payload.description ? String(payload.description).trim() : null;
  }

  if (payload.managerEmployeeId !== undefined) {
    if (payload.managerEmployeeId) {
      await ensureEmployeeInTenant(String(payload.managerEmployeeId), tenantId, 'managerEmployeeId');
      data.managerEmployeeId = String(payload.managerEmployeeId).trim();
    } else {
      data.managerEmployeeId = null;
    }
  }

  const updated = await prisma.kpiDefinition.update({
    where: { id: kpiDefinitionId },
    data,
    select: kpiDefinitionSelect,
  });

  return serializeKpiDefinition(updated);
}

async function deleteKpiDefinition(kpiDefinitionId, tenantId) {
  const existing = await prisma.kpiDefinition.findFirst({
    where: {
      id: kpiDefinitionId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'KPI introuvable.');
  }

  await prisma.$transaction([
    prisma.performanceGoal.updateMany({
      where: {
        tenantId,
        kpiDefinitionId,
      },
      data: {
        kpiDefinitionId: null,
      },
    }),
    prisma.kpiDefinition.delete({
      where: { id: kpiDefinitionId },
    }),
  ]);

  return { id: kpiDefinitionId };
}

async function listKpiAssignments(query, tenantId) {
  const pagination = parsePagination(query);
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(query.cycleId ? { cycleId: String(query.cycleId) } : {}),
    ...(query.employeeId ? { employeeId: String(query.employeeId) } : {}),
    ...(query.status ? { status: String(query.status) } : {}),
    ...(searchFilter
      ? {
          OR: [
            { summary: searchFilter },
            { riskLevel: searchFilter },
            { status: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.kpiAssignment.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: kpiAssignmentSelect,
    }),
    prisma.kpiAssignment.count({ where }),
  ]);

  return {
    items: items.map(serializeKpiAssignment),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createKpiAssignment(payload, tenantId) {
  const cycleId = String(payload.cycleId || '').trim();
  const employeeId = String(payload.employeeId || '').trim();

  if (!cycleId || !employeeId) {
    throw new AppError(400, 'Les champs cycleId et employeeId sont obligatoires.');
  }

  await Promise.all([
    ensureCycleExists(cycleId, tenantId),
    ensureEmployeeInTenant(employeeId, tenantId, 'employeeId'),
  ]);

  if (payload.managerEmployeeId) {
    await ensureEmployeeInTenant(String(payload.managerEmployeeId), tenantId, 'managerEmployeeId');
  }

  const created = await prisma.kpiAssignment.create({
    data: {
      tenantId,
      cycleId,
      employeeId,
      managerEmployeeId: payload.managerEmployeeId ? String(payload.managerEmployeeId).trim() : null,
      summary: payload.summary ? String(payload.summary).trim() : null,
      assignedKpis: Number.parseInt(payload.assignedKpis, 10) || 0,
      totalWeight: parseDecimalField(payload.totalWeight, 'totalWeight'),
      completionPercent: parseDecimalField(payload.completionPercent, 'completionPercent') ?? 0,
      riskLevel: payload.riskLevel ? String(payload.riskLevel).trim() : 'Medium',
      status: payload.status ? String(payload.status).trim() : 'Active',
    },
    select: kpiAssignmentSelect,
  });

  return serializeKpiAssignment(created);
}

async function updateKpiAssignment(assignmentId, payload, tenantId) {
  const existing = await prisma.kpiAssignment.findFirst({
    where: {
      id: assignmentId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Affectation KPI introuvable.');
  }

  const data = {};

  if (payload.cycleId !== undefined) {
    await ensureCycleExists(String(payload.cycleId), tenantId);
    data.cycleId = String(payload.cycleId);
  }

  if (payload.employeeId !== undefined) {
    await ensureEmployeeInTenant(String(payload.employeeId), tenantId, 'employeeId');
    data.employeeId = String(payload.employeeId);
  }

  if (payload.managerEmployeeId !== undefined) {
    if (payload.managerEmployeeId) {
      await ensureEmployeeInTenant(String(payload.managerEmployeeId), tenantId, 'managerEmployeeId');
      data.managerEmployeeId = String(payload.managerEmployeeId);
    } else {
      data.managerEmployeeId = null;
    }
  }

  if (payload.summary !== undefined) {
    data.summary = payload.summary ? String(payload.summary).trim() : null;
  }

  if (payload.assignedKpis !== undefined) {
    data.assignedKpis = Number.parseInt(payload.assignedKpis, 10) || 0;
  }

  if (payload.totalWeight !== undefined) {
    data.totalWeight = parseDecimalField(payload.totalWeight, 'totalWeight');
  }

  if (payload.completionPercent !== undefined) {
    data.completionPercent = parseDecimalField(payload.completionPercent, 'completionPercent');
  }

  if (payload.riskLevel !== undefined) {
    data.riskLevel = payload.riskLevel ? String(payload.riskLevel).trim() : null;
  }

  if (payload.status !== undefined) {
    data.status = payload.status ? String(payload.status).trim() : null;
  }

  const updated = await prisma.kpiAssignment.update({
    where: { id: assignmentId },
    data,
    select: kpiAssignmentSelect,
  });

  return serializeKpiAssignment(updated);
}

async function deleteKpiAssignment(assignmentId, tenantId) {
  const existing = await prisma.kpiAssignment.findFirst({
    where: {
      id: assignmentId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Affectation KPI introuvable.');
  }

  await prisma.kpiAssignment.delete({
    where: { id: assignmentId },
  });

  return { id: assignmentId };
}

async function listKpiCheckIns(query, tenantId) {
  const pagination = parsePagination(query);
  const searchFilter = buildContains(query.search);

  const where = {
    tenantId,
    ...(query.goalId ? { goalId: String(query.goalId) } : {}),
    ...(query.status ? { status: String(query.status) } : {}),
    ...(searchFilter
      ? {
          OR: [
            { title: searchFilter },
            { blocker: searchFilter },
            { supportNeeded: searchFilter },
            { nextActions: searchFilter },
          ],
        }
      : {}),
  };

  const [items, totalItems] = await Promise.all([
    prisma.kpiCheckIn.findMany({
      where,
      orderBy: [{ checkInDate: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
      select: kpiCheckInSelect,
    }),
    prisma.kpiCheckIn.count({ where }),
  ]);

  return {
    items: items.map(serializeKpiCheckIn),
    pagination: buildPagination(pagination.page, pagination.limit, totalItems),
  };
}

async function createKpiCheckIn(payload, tenantId) {
  const goalId = String(payload.goalId || '').trim();
  const title = String(payload.title || '').trim();

  if (!goalId || !title) {
    throw new AppError(400, 'Les champs goalId et title sont obligatoires.');
  }

  await ensureGoalExists(goalId, tenantId);

  const created = await prisma.kpiCheckIn.create({
    data: {
      tenantId,
      goalId,
      title,
      checkInDate: parseDateField(payload.checkInDate, 'checkInDate', true),
      progressPercent: parseDecimalField(payload.progressPercent, 'progressPercent'),
      blocker: payload.blocker ? String(payload.blocker).trim() : null,
      supportNeeded: payload.supportNeeded ? String(payload.supportNeeded).trim() : null,
      nextActions: payload.nextActions ? String(payload.nextActions).trim() : null,
      status: payload.status ? String(payload.status).trim() : 'Scheduled',
    },
    select: kpiCheckInSelect,
  });

  return serializeKpiCheckIn(created);
}

async function updateKpiCheckIn(checkInId, payload, tenantId) {
  const existing = await prisma.kpiCheckIn.findFirst({
    where: {
      id: checkInId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Check-in KPI introuvable.');
  }

  const data = {};

  if (payload.goalId !== undefined) {
    await ensureGoalExists(String(payload.goalId), tenantId);
    data.goalId = String(payload.goalId);
  }

  if (payload.title !== undefined) {
    const title = String(payload.title || '').trim();
    if (!title) {
      throw new AppError(400, 'Le titre du check-in ne peut pas etre vide.');
    }
    data.title = title;
  }

  if (payload.checkInDate !== undefined) {
    data.checkInDate = parseDateField(payload.checkInDate, 'checkInDate', true);
  }

  if (payload.progressPercent !== undefined) {
    data.progressPercent = parseDecimalField(payload.progressPercent, 'progressPercent');
  }

  if (payload.blocker !== undefined) {
    data.blocker = payload.blocker ? String(payload.blocker).trim() : null;
  }

  if (payload.supportNeeded !== undefined) {
    data.supportNeeded = payload.supportNeeded ? String(payload.supportNeeded).trim() : null;
  }

  if (payload.nextActions !== undefined) {
    data.nextActions = payload.nextActions ? String(payload.nextActions).trim() : null;
  }

  if (payload.status !== undefined) {
    data.status = payload.status ? String(payload.status).trim() : null;
  }

  const updated = await prisma.kpiCheckIn.update({
    where: { id: checkInId },
    data,
    select: kpiCheckInSelect,
  });

  return serializeKpiCheckIn(updated);
}

async function deleteKpiCheckIn(checkInId, tenantId) {
  const existing = await prisma.kpiCheckIn.findFirst({
    where: {
      id: checkInId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, 'Check-in KPI introuvable.');
  }

  await prisma.kpiCheckIn.delete({
    where: { id: checkInId },
  });

  return { id: checkInId };
}

module.exports = {
  createCycle,
  createFeedback,
  createGoal,
  createKpiAssignment,
  createKpiCheckIn,
  createKpiDefinition,
  createReview,
  createTraining,
  deleteCycle,
  deleteGoal,
  deleteKpiAssignment,
  deleteKpiCheckIn,
  deleteKpiDefinition,
  deleteReview,
  deleteTraining,
  getPerformanceDashboard,
  getPerformanceOptions,
  listKpiAssignments,
  listKpiCheckIns,
  listKpiDefinitions,
  listCycles,
  listFeedbacks,
  listGoals,
  listReviews,
  listTrainings,
  updateCycle,
  updateGoal,
  updateKpiAssignment,
  updateKpiCheckIn,
  updateKpiDefinition,
  updateReview,
  updateTraining,
};
