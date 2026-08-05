const {
  RecruitmentPlanningAction,
  RecruitmentPlanningEntityType,
  RecruitmentWeeklyPlanStatus,
} = require('@prisma/client');

const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');

const userSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

const weeklyPlanInclude = {
  createdBy: { select: userSummarySelect },
  updatedBy: { select: userSummarySelect },
};

const pipelineStepInclude = {
  createdBy: { select: userSummarySelect },
  updatedBy: { select: userSummarySelect },
};

const scorecardCriterionInclude = {
  createdBy: { select: userSummarySelect },
  updatedBy: { select: userSummarySelect },
};

const historyInclude = {
  performedBy: { select: userSummarySelect },
};

function ensureEnumValue(enumObject, value, fieldName) {
  if (!value) {
    throw new AppError(400, `${fieldName} est obligatoire.`);
  }

  const normalized = String(value).toUpperCase();

  if (!enumObject[normalized]) {
    throw new AppError(400, `Valeur invalide pour ${fieldName}: ${value}`);
  }

  return enumObject[normalized];
}

function parseNonEmptyText(value, fieldName) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new AppError(400, `${fieldName} est obligatoire.`);
  }

  return normalized;
}

function parsePositiveInt(value, fieldName) {
  const normalized = Number.parseInt(value, 10);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new AppError(400, `Valeur entiere positive invalide pour ${fieldName}.`);
  }

  return normalized;
}

function parseNonNegativeInt(value, fieldName) {
  const normalized = Number.parseInt(value, 10);

  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new AppError(400, `Valeur entiere invalide pour ${fieldName}.`);
  }

  return normalized;
}

function parseWeight(value) {
  const normalized = Number(value);

  if (Number.isNaN(normalized) || normalized <= 0) {
    throw new AppError(400, 'weight doit etre un nombre positif.');
  }

  return normalized;
}

function toSerializableJson(value) {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue) => {
      if (currentValue instanceof Date) {
        return currentValue.toISOString();
      }

      return currentValue;
    }),
  );
}

async function nextOrderIndex(tx, modelName, tenantId) {
  const maxEntry = await tx[modelName].findFirst({
    where: {
      tenantId,
    },
    orderBy: {
      orderIndex: 'desc',
    },
    select: {
      orderIndex: true,
    },
  });

  return (maxEntry?.orderIndex || 0) + 1;
}

async function logPlanningHistory(tx, payload) {
  return tx.recruitmentPlanningHistory.create({
    data: {
      tenantId: payload.tenantId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      beforeData: payload.beforeData ? toSerializableJson(payload.beforeData) : null,
      afterData: payload.afterData ? toSerializableJson(payload.afterData) : null,
      performedById: payload.actorId || null,
      weeklyPlanId: payload.weeklyPlanId || null,
      pipelineStepId: payload.pipelineStepId || null,
      scorecardCriterionId: payload.scorecardCriterionId || null,
    },
  });
}

async function listRecruitmentPlanningData(tenantId) {
  const [weeklyPlans, pipelineSteps, scorecardCriteria, history] = await Promise.all([
    prisma.recruitmentWeeklyPlan.findMany({
      where: {
        tenantId,
      },
      include: weeklyPlanInclude,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.recruitmentPipelineStep.findMany({
      where: {
        tenantId,
      },
      include: pipelineStepInclude,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.recruitmentScorecardCriterion.findMany({
      where: {
        tenantId,
      },
      include: scorecardCriterionInclude,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.recruitmentPlanningHistory.findMany({
      where: {
        tenantId,
      },
      include: historyInclude,
      orderBy: {
        createdAt: 'desc',
      },
      take: 40,
    }),
  ]);

  const totalScorecardWeight = scorecardCriteria.reduce(
    (sum, item) => sum + Number(item.weight || 0),
    0,
  );

  return {
    weeklyPlans,
    pipelineSteps,
    scorecardCriteria,
    history,
    summary: {
      weeklyPlansCount: weeklyPlans.length,
      pipelineStepsCount: pipelineSteps.length,
      scorecardCriteriaCount: scorecardCriteria.length,
      totalScorecardWeight,
    },
  };
}

async function listRecruitmentPlanningHistory(filters = {}, tenantId) {
  const where = {};

  where.tenantId = tenantId;

  if (filters.entityType) {
    where.entityType = ensureEnumValue(RecruitmentPlanningEntityType, filters.entityType, 'entityType');
  }

  if (filters.entityId) {
    where.entityId = String(filters.entityId).trim();
  }

  const limit = filters.limit === undefined
    ? 100
    : parsePositiveInt(filters.limit, 'limit');

  return prisma.recruitmentPlanningHistory.findMany({
    where,
    include: historyInclude,
    orderBy: {
      createdAt: 'desc',
    },
    take: Math.min(limit, 200),
  });
}

async function createWeeklyPlan(payload, actorId, tenantId) {
  const weekLabel = parseNonEmptyText(payload.weekLabel, 'weekLabel');
  const objective = parseNonEmptyText(payload.objective, 'objective');
  const keyActions = parseNonEmptyText(payload.keyActions, 'keyActions');
  const ownerLabel = parseNonEmptyText(payload.ownerLabel, 'ownerLabel');
  const deliverable = parseNonEmptyText(payload.deliverable, 'deliverable');
  const kpiTarget = parseNonEmptyText(payload.kpiTarget, 'kpiTarget');

  return prisma.$transaction(async (tx) => {
    const created = await tx.recruitmentWeeklyPlan.create({
      data: {
        weekLabel,
        objective,
        keyActions,
        ownerLabel,
        deliverable,
        kpiTarget,
        tenantId,
        status: payload.status
          ? ensureEnumValue(RecruitmentWeeklyPlanStatus, payload.status, 'status')
          : RecruitmentWeeklyPlanStatus.PLANNED,
        orderIndex: payload.orderIndex !== undefined
          ? parseNonNegativeInt(payload.orderIndex, 'orderIndex')
          : await nextOrderIndex(tx, 'recruitmentWeeklyPlan', tenantId),
        createdById: actorId || null,
        updatedById: actorId || null,
      },
      include: weeklyPlanInclude,
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.WEEKLY_PLAN,
      entityId: created.id,
      action: RecruitmentPlanningAction.CREATED,
      tenantId,
      afterData: created,
      actorId,
      weeklyPlanId: created.id,
    });

    return created;
  });
}

async function updateWeeklyPlan(weeklyPlanId, payload, actorId, tenantId) {
  const existing = await prisma.recruitmentWeeklyPlan.findFirst({
    where: {
      id: weeklyPlanId,
      tenantId,
    },
    include: weeklyPlanInclude,
  });

  if (!existing) {
    throw new AppError(404, 'Planning hebdomadaire introuvable.');
  }

  const data = {};

  if (payload.weekLabel !== undefined) data.weekLabel = parseNonEmptyText(payload.weekLabel, 'weekLabel');
  if (payload.objective !== undefined) data.objective = parseNonEmptyText(payload.objective, 'objective');
  if (payload.keyActions !== undefined) data.keyActions = parseNonEmptyText(payload.keyActions, 'keyActions');
  if (payload.ownerLabel !== undefined) data.ownerLabel = parseNonEmptyText(payload.ownerLabel, 'ownerLabel');
  if (payload.deliverable !== undefined) data.deliverable = parseNonEmptyText(payload.deliverable, 'deliverable');
  if (payload.kpiTarget !== undefined) data.kpiTarget = parseNonEmptyText(payload.kpiTarget, 'kpiTarget');
  if (payload.status !== undefined) data.status = ensureEnumValue(RecruitmentWeeklyPlanStatus, payload.status, 'status');
  if (payload.orderIndex !== undefined) data.orderIndex = parseNonNegativeInt(payload.orderIndex, 'orderIndex');

  data.updatedById = actorId || null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.recruitmentWeeklyPlan.update({
      where: { id: weeklyPlanId },
      data,
      include: weeklyPlanInclude,
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.WEEKLY_PLAN,
      entityId: updated.id,
      action: RecruitmentPlanningAction.UPDATED,
      tenantId,
      beforeData: existing,
      afterData: updated,
      actorId,
      weeklyPlanId: updated.id,
    });

    return updated;
  });
}

async function deleteWeeklyPlan(weeklyPlanId, actorId, tenantId) {
  const existing = await prisma.recruitmentWeeklyPlan.findFirst({
    where: {
      id: weeklyPlanId,
      tenantId,
    },
  });

  if (!existing) {
    throw new AppError(404, 'Planning hebdomadaire introuvable.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.recruitmentWeeklyPlan.delete({
      where: { id: weeklyPlanId },
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.WEEKLY_PLAN,
      entityId: weeklyPlanId,
      action: RecruitmentPlanningAction.DELETED,
      tenantId,
      beforeData: existing,
      actorId,
      weeklyPlanId: weeklyPlanId,
    });

    return existing;
  });
}

async function createPipelineStep(payload, actorId, tenantId) {
  const stepName = parseNonEmptyText(payload.stepName, 'stepName');
  const entryCriteria = parseNonEmptyText(payload.entryCriteria, 'entryCriteria');
  const exitCriteria = parseNonEmptyText(payload.exitCriteria, 'exitCriteria');
  const ownerLabel = parseNonEmptyText(payload.ownerLabel, 'ownerLabel');
  const slaDays = parsePositiveInt(payload.slaDays, 'slaDays');

  return prisma.$transaction(async (tx) => {
    const created = await tx.recruitmentPipelineStep.create({
      data: {
        stepName,
        entryCriteria,
        exitCriteria,
        ownerLabel,
        slaDays,
        tenantId,
        orderIndex: payload.orderIndex !== undefined
          ? parseNonNegativeInt(payload.orderIndex, 'orderIndex')
          : await nextOrderIndex(tx, 'recruitmentPipelineStep', tenantId),
        isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
        createdById: actorId || null,
        updatedById: actorId || null,
      },
      include: pipelineStepInclude,
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.PIPELINE_STEP,
      entityId: created.id,
      action: RecruitmentPlanningAction.CREATED,
      tenantId,
      afterData: created,
      actorId,
      pipelineStepId: created.id,
    });

    return created;
  });
}

async function updatePipelineStep(pipelineStepId, payload, actorId, tenantId) {
  const existing = await prisma.recruitmentPipelineStep.findFirst({
    where: {
      id: pipelineStepId,
      tenantId,
    },
    include: pipelineStepInclude,
  });

  if (!existing) {
    throw new AppError(404, 'Etape pipeline introuvable.');
  }

  const data = {};

  if (payload.stepName !== undefined) data.stepName = parseNonEmptyText(payload.stepName, 'stepName');
  if (payload.entryCriteria !== undefined) data.entryCriteria = parseNonEmptyText(payload.entryCriteria, 'entryCriteria');
  if (payload.exitCriteria !== undefined) data.exitCriteria = parseNonEmptyText(payload.exitCriteria, 'exitCriteria');
  if (payload.ownerLabel !== undefined) data.ownerLabel = parseNonEmptyText(payload.ownerLabel, 'ownerLabel');
  if (payload.slaDays !== undefined) data.slaDays = parsePositiveInt(payload.slaDays, 'slaDays');
  if (payload.orderIndex !== undefined) data.orderIndex = parseNonNegativeInt(payload.orderIndex, 'orderIndex');
  if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);

  data.updatedById = actorId || null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.recruitmentPipelineStep.update({
      where: { id: pipelineStepId },
      data,
      include: pipelineStepInclude,
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.PIPELINE_STEP,
      entityId: updated.id,
      action: RecruitmentPlanningAction.UPDATED,
      tenantId,
      beforeData: existing,
      afterData: updated,
      actorId,
      pipelineStepId: updated.id,
    });

    return updated;
  });
}

async function deletePipelineStep(pipelineStepId, actorId, tenantId) {
  const existing = await prisma.recruitmentPipelineStep.findFirst({
    where: {
      id: pipelineStepId,
      tenantId,
    },
  });

  if (!existing) {
    throw new AppError(404, 'Etape pipeline introuvable.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.recruitmentPipelineStep.delete({
      where: { id: pipelineStepId },
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.PIPELINE_STEP,
      entityId: pipelineStepId,
      action: RecruitmentPlanningAction.DELETED,
      tenantId,
      beforeData: existing,
      actorId,
      pipelineStepId,
    });

    return existing;
  });
}

async function createScorecardCriterion(payload, actorId, tenantId) {
  const criterion = parseNonEmptyText(payload.criterion, 'criterion');
  const weight = parseWeight(payload.weight);
  const notes = payload.notes === undefined ? null : String(payload.notes || '').trim() || null;

  return prisma.$transaction(async (tx) => {
    const created = await tx.recruitmentScorecardCriterion.create({
      data: {
        criterion,
        weight,
        notes,
        tenantId,
        orderIndex: payload.orderIndex !== undefined
          ? parseNonNegativeInt(payload.orderIndex, 'orderIndex')
          : await nextOrderIndex(tx, 'recruitmentScorecardCriterion', tenantId),
        isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
        createdById: actorId || null,
        updatedById: actorId || null,
      },
      include: scorecardCriterionInclude,
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.SCORECARD_CRITERION,
      entityId: created.id,
      action: RecruitmentPlanningAction.CREATED,
      tenantId,
      afterData: created,
      actorId,
      scorecardCriterionId: created.id,
    });

    return created;
  });
}

async function updateScorecardCriterion(scorecardCriterionId, payload, actorId, tenantId) {
  const existing = await prisma.recruitmentScorecardCriterion.findFirst({
    where: {
      id: scorecardCriterionId,
      tenantId,
    },
    include: scorecardCriterionInclude,
  });

  if (!existing) {
    throw new AppError(404, 'Critere scorecard introuvable.');
  }

  const data = {};

  if (payload.criterion !== undefined) data.criterion = parseNonEmptyText(payload.criterion, 'criterion');
  if (payload.weight !== undefined) data.weight = parseWeight(payload.weight);
  if (payload.orderIndex !== undefined) data.orderIndex = parseNonNegativeInt(payload.orderIndex, 'orderIndex');
  if (payload.notes !== undefined) data.notes = String(payload.notes || '').trim() || null;
  if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);

  data.updatedById = actorId || null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.recruitmentScorecardCriterion.update({
      where: { id: scorecardCriterionId },
      data,
      include: scorecardCriterionInclude,
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.SCORECARD_CRITERION,
      entityId: updated.id,
      action: RecruitmentPlanningAction.UPDATED,
      tenantId,
      beforeData: existing,
      afterData: updated,
      actorId,
      scorecardCriterionId: updated.id,
    });

    return updated;
  });
}

async function deleteScorecardCriterion(scorecardCriterionId, actorId, tenantId) {
  const existing = await prisma.recruitmentScorecardCriterion.findFirst({
    where: {
      id: scorecardCriterionId,
      tenantId,
    },
  });

  if (!existing) {
    throw new AppError(404, 'Critere scorecard introuvable.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.recruitmentScorecardCriterion.delete({
      where: { id: scorecardCriterionId },
    });

    await logPlanningHistory(tx, {
      entityType: RecruitmentPlanningEntityType.SCORECARD_CRITERION,
      entityId: scorecardCriterionId,
      action: RecruitmentPlanningAction.DELETED,
      tenantId,
      beforeData: existing,
      actorId,
      scorecardCriterionId,
    });

    return existing;
  });
}

module.exports = {
  createPipelineStep,
  createScorecardCriterion,
  createWeeklyPlan,
  deletePipelineStep,
  deleteScorecardCriterion,
  deleteWeeklyPlan,
  listRecruitmentPlanningData,
  listRecruitmentPlanningHistory,
  updatePipelineStep,
  updateScorecardCriterion,
  updateWeeklyPlan,
};
