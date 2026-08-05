const {
  ApplicationStage,
  ApplicationStatus,
  CandidateSource,
  EmploymentType,
  InterviewStatus,
  InterviewType,
  JobPostingStatus,
  OfferStatus,
  OnboardingStatus,
  OnboardingTaskStatus,
  RecruitmentRequestStatus,
  TalentDocumentCategory,
  TalentDocumentOwnerType,
} = require('@prisma/client');

const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');
const { buildPagination, parsePagination } = require('../utils/pagination');

const userSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
};

const recruitmentRequestInclude = {
  requestedBy: { select: userSummarySelect },
  approvedBy: { select: userSummarySelect },
  jobPostings: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
    },
  },
};

const jobPostingInclude = {
  recruitmentRequest: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  recruiter: { select: userSummarySelect },
  hiringManager: { select: userSummarySelect },
  _count: {
    select: {
      applications: true,
    },
  },
};

const candidateInclude = {
  _count: {
    select: {
      applications: true,
    },
  },
};

const applicationInclude = {
  candidate: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      source: true,
      tags: true,
    },
  },
  jobPosting: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      departmentName: true,
      employmentType: true,
    },
  },
  interviews: {
    orderBy: {
      scheduledAt: 'desc',
    },
  },
  offer: true,
  onboardingPlan: {
    include: {
      tasks: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  },
};

const offerInclude = {
  application: {
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      jobPosting: {
        select: {
          id: true,
          code: true,
          title: true,
          departmentName: true,
        },
      },
    },
  },
};

const onboardingPlanInclude = {
  application: {
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      jobPosting: {
        select: {
          id: true,
          code: true,
          title: true,
          departmentName: true,
        },
      },
      offer: true,
    },
  },
  tasks: {
    orderBy: {
      createdAt: 'asc',
    },
  },
};

const interviewInclude = {
  application: {
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
          code: true,
        },
      },
    },
  },
  interviewer: { select: userSummarySelect },
};

const talentDocumentInclude = {
  candidate: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  onboardingPlan: {
    select: {
      id: true,
      status: true,
      departmentName: true,
      siteName: true,
    },
  },
  uploadedBy: { select: userSummarySelect },
};

function parseDate(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `Date invalide pour ${fieldName}.`);
  }

  return parsed;
}

function parseOptionalDecimal(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);

  if (Number.isNaN(normalized)) {
    throw new AppError(400, `Valeur numerique invalide pour ${fieldName}.`);
  }

  return normalized;
}

function parsePositiveInt(value, fieldName, fallbackValue) {
  const normalized = value === undefined || value === null || value === ''
    ? fallbackValue
    : Number.parseInt(value, 10);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new AppError(400, `Valeur entiere positive invalide pour ${fieldName}.`);
  }

  return normalized;
}

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

function buildJobPostingCode() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `JOB-${stamp}-${suffix}`;
}

async function ensureUserExists(userId, fieldName, tenantId) {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, `Utilisateur introuvable pour ${fieldName}.`);
  }

  return user.id;
}

async function createRecruitmentRequest(payload, actorId, tenantId) {
  const title = payload.title?.trim();
  const departmentName = payload.departmentName?.trim();

  if (!title || !departmentName) {
    throw new AppError(400, 'title et departmentName sont obligatoires.');
  }

  const createdRequest = await prisma.recruitmentRequest.create({
    data: {
      tenantId,
      title,
      departmentName,
      location: payload.location?.trim() || null,
      employmentType: ensureEnumValue(EmploymentType, payload.employmentType, 'employmentType'),
      headcount: parsePositiveInt(payload.headcount, 'headcount', 1),
      budgetAmount: parseOptionalDecimal(payload.budgetAmount, 'budgetAmount'),
      currency: payload.currency?.trim() || null,
      targetStartDate: parseDate(payload.targetStartDate, 'targetStartDate'),
      reason: payload.reason?.trim() || null,
      status: payload.status ? ensureEnumValue(RecruitmentRequestStatus, payload.status, 'status') : RecruitmentRequestStatus.DRAFT,
      requestedById: actorId,
    },
    include: recruitmentRequestInclude,
  });

  return createdRequest;
}

async function listRecruitmentRequests(params = {}, tenantId) {
  const { page, limit, skip, take } = parsePagination(params);
  const [totalItems, items] = await Promise.all([
    prisma.recruitmentRequest.count({
      where: {
        tenantId,
      },
    }),
    prisma.recruitmentRequest.findMany({
      where: {
        tenantId,
      },
      skip,
      take,
      include: recruitmentRequestInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function updateRecruitmentRequestStatus(requestId, payload, actorId, tenantId) {
  const status = ensureEnumValue(RecruitmentRequestStatus, payload.status, 'status');
  const currentRequest = await prisma.recruitmentRequest.findFirst({
    where: {
      id: requestId,
      tenantId,
    },
  });

  if (!currentRequest) {
    throw new AppError(404, 'Demande de recrutement introuvable.');
  }

  const data = {
    status,
    approvalComment: payload.approvalComment?.trim() || null,
  };

  if ([RecruitmentRequestStatus.APPROVED, RecruitmentRequestStatus.REJECTED].includes(status)) {
    data.approvedById = actorId;
    data.approvedAt = new Date();
  }

  const updatedRequest = await prisma.recruitmentRequest.update({
    where: { id: requestId },
    data,
    include: recruitmentRequestInclude,
  });

  return updatedRequest;
}

async function createJobPosting(payload, tenantId) {
  const title = payload.title?.trim();
  const description = payload.description?.trim();
  const departmentName = payload.departmentName?.trim();

  if (!title || !description || !departmentName) {
    throw new AppError(400, 'title, description et departmentName sont obligatoires.');
  }

  if (payload.recruitmentRequestId) {
    const request = await prisma.recruitmentRequest.findFirst({
      where: {
        id: payload.recruitmentRequestId,
        tenantId,
      },
      select: { id: true },
    });

    if (!request) {
      throw new AppError(404, 'Demande de recrutement introuvable.');
    }
  }

  const status = payload.status
    ? ensureEnumValue(JobPostingStatus, payload.status, 'status')
    : JobPostingStatus.DRAFT;

  const createdPosting = await prisma.jobPosting.create({
    data: {
      tenantId,
      recruitmentRequestId: payload.recruitmentRequestId || null,
      code: payload.code?.trim() || buildJobPostingCode(),
      title,
      description,
      departmentName,
      location: payload.location?.trim() || null,
      employmentType: ensureEnumValue(EmploymentType, payload.employmentType, 'employmentType'),
      openings: parsePositiveInt(payload.openings, 'openings', 1),
      status,
      publishedAt: status === JobPostingStatus.PUBLISHED ? new Date() : null,
      recruiterId: await ensureUserExists(payload.recruiterId, 'recruiterId', tenantId),
      hiringManagerId: await ensureUserExists(payload.hiringManagerId, 'hiringManagerId', tenantId),
    },
    include: jobPostingInclude,
  });

  return createdPosting;
}

async function listJobPostings(params = {}, tenantId) {
  const { page, limit, skip, take } = parsePagination(params);
  const [totalItems, items] = await Promise.all([
    prisma.jobPosting.count({
      where: {
        tenantId,
      },
    }),
    prisma.jobPosting.findMany({
      where: {
        tenantId,
      },
      skip,
      take,
      include: jobPostingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function updateJobPosting(jobPostingId, payload, tenantId) {
  const existingPosting = await prisma.jobPosting.findFirst({
    where: {
      id: jobPostingId,
      tenantId,
    },
  });

  if (!existingPosting) {
    throw new AppError(404, 'Offre de recrutement introuvable.');
  }

  if (payload.recruitmentRequestId) {
    const request = await prisma.recruitmentRequest.findFirst({
      where: {
        id: payload.recruitmentRequestId,
        tenantId,
      },
      select: { id: true },
    });

    if (!request) {
      throw new AppError(404, 'Demande de recrutement introuvable.');
    }
  }

  const nextStatus = payload.status
    ? ensureEnumValue(JobPostingStatus, payload.status, 'status')
    : existingPosting.status;

  const updatedPosting = await prisma.jobPosting.update({
    where: { id: jobPostingId },
    data: {
      recruitmentRequestId: payload.recruitmentRequestId !== undefined ? payload.recruitmentRequestId || null : undefined,
      title: payload.title !== undefined ? payload.title?.trim() || existingPosting.title : undefined,
      description: payload.description !== undefined ? payload.description?.trim() || existingPosting.description : undefined,
      departmentName: payload.departmentName !== undefined ? payload.departmentName?.trim() || existingPosting.departmentName : undefined,
      location: payload.location !== undefined ? payload.location?.trim() || null : undefined,
      employmentType: payload.employmentType ? ensureEnumValue(EmploymentType, payload.employmentType, 'employmentType') : undefined,
      openings: payload.openings !== undefined ? parsePositiveInt(payload.openings, 'openings', existingPosting.openings) : undefined,
      status: nextStatus,
      recruiterId: payload.recruiterId !== undefined ? await ensureUserExists(payload.recruiterId, 'recruiterId', tenantId) : undefined,
      hiringManagerId: payload.hiringManagerId !== undefined ? await ensureUserExists(payload.hiringManagerId, 'hiringManagerId', tenantId) : undefined,
      publishedAt: nextStatus === JobPostingStatus.PUBLISHED && !existingPosting.publishedAt ? new Date() : existingPosting.publishedAt,
      closedAt: [JobPostingStatus.CLOSED, JobPostingStatus.ARCHIVED].includes(nextStatus)
        ? (existingPosting.closedAt || new Date())
        : (nextStatus === JobPostingStatus.PUBLISHED ? null : existingPosting.closedAt),
    },
    include: jobPostingInclude,
  });

  return updatedPosting;
}

async function createCandidate(payload, tenantId) {
  const firstName = payload.firstName?.trim();
  const lastName = payload.lastName?.trim();

  if (!firstName || !lastName) {
    throw new AppError(400, 'firstName et lastName sont obligatoires.');
  }

  if (!payload.email && !payload.phone) {
    throw new AppError(400, 'email ou phone est obligatoire.');
  }

  const createdCandidate = await prisma.candidate.create({
    data: {
      tenantId,
      firstName,
      lastName,
      email: payload.email?.trim().toLowerCase() || null,
      phone: payload.phone?.trim() || null,
      source: payload.source ? ensureEnumValue(CandidateSource, payload.source, 'source') : CandidateSource.OTHER,
      resumeUrl: payload.resumeUrl?.trim() || null,
      summary: payload.summary?.trim() || null,
      tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    },
    include: candidateInclude,
  });

  return createdCandidate;
}

async function listCandidates(params = {}, tenantId) {
  const { page, limit, skip, take } = parsePagination(params);
  const [totalItems, items] = await Promise.all([
    prisma.candidate.count({
      where: {
        tenantId,
      },
    }),
    prisma.candidate.findMany({
      where: {
        tenantId,
      },
      skip,
      take,
      include: candidateInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function updateCandidate(candidateId, payload, tenantId) {
  const existingCandidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      tenantId,
    },
  });

  if (!existingCandidate) {
    throw new AppError(404, 'Candidat introuvable.');
  }

  const updatedCandidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      firstName: payload.firstName !== undefined ? payload.firstName?.trim() || existingCandidate.firstName : undefined,
      lastName: payload.lastName !== undefined ? payload.lastName?.trim() || existingCandidate.lastName : undefined,
      email: payload.email !== undefined ? payload.email?.trim().toLowerCase() || null : undefined,
      phone: payload.phone !== undefined ? payload.phone?.trim() || null : undefined,
      source: payload.source ? ensureEnumValue(CandidateSource, payload.source, 'source') : undefined,
      resumeUrl: payload.resumeUrl !== undefined ? payload.resumeUrl?.trim() || null : undefined,
      summary: payload.summary !== undefined ? payload.summary?.trim() || null : undefined,
      tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean) : undefined,
    },
    include: candidateInclude,
  });

  return updatedCandidate;
}

async function createApplication(payload, tenantId) {
  if (!payload.jobPostingId || !payload.candidateId) {
    throw new AppError(400, 'jobPostingId et candidateId sont obligatoires.');
  }

  const [jobPosting, candidate] = await Promise.all([
    prisma.jobPosting.findFirst({
      where: {
        id: payload.jobPostingId,
        tenantId,
      },
      select: { id: true },
    }),
    prisma.candidate.findFirst({
      where: {
        id: payload.candidateId,
        tenantId,
      },
      select: { id: true },
    }),
  ]);

  if (!jobPosting) {
    throw new AppError(404, 'Offre de recrutement introuvable.');
  }

  if (!candidate) {
    throw new AppError(404, 'Candidat introuvable.');
  }

  const stage = payload.stage ? ensureEnumValue(ApplicationStage, payload.stage, 'stage') : ApplicationStage.APPLIED;
  const lastStageApplication = await prisma.application.findFirst({
    where: {
      tenantId,
      stage,
    },
    orderBy: {
      kanbanOrder: 'desc',
    },
    select: {
      kanbanOrder: true,
    },
  });

  const createdApplication = await prisma.application.create({
    data: {
      tenantId,
      jobPostingId: payload.jobPostingId,
      candidateId: payload.candidateId,
      stage,
      kanbanOrder: (lastStageApplication?.kanbanOrder || 0) + 1,
      status: payload.status ? ensureEnumValue(ApplicationStatus, payload.status, 'status') : ApplicationStatus.ACTIVE,
      score: parseOptionalDecimal(payload.score, 'score'),
      rejectionReason: payload.rejectionReason?.trim() || null,
      notes: payload.notes?.trim() || null,
    },
    include: applicationInclude,
  });

  return createdApplication;
}

async function listApplications(filters = {}, tenantId) {
  const where = {
    tenantId,
  };

  if (filters.jobPostingId) {
    where.jobPostingId = filters.jobPostingId;
  }

  if (filters.candidateId) {
    where.candidateId = filters.candidateId;
  }

  if (filters.stage) {
    where.stage = ensureEnumValue(ApplicationStage, filters.stage, 'stage');
  }

  if (filters.status) {
    where.status = ensureEnumValue(ApplicationStatus, filters.status, 'status');
  }

  const { page, limit, skip, take } = parsePagination(filters);
  const [totalItems, items] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      skip,
      take,
      include: applicationInclude,
      orderBy: [
        { kanbanOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function updateApplicationStage(applicationId, payload, tenantId) {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      tenantId,
    },
  });

  if (!application) {
    throw new AppError(404, 'Candidature introuvable.');
  }

  const stage = payload.stage ? ensureEnumValue(ApplicationStage, payload.stage, 'stage') : application.stage;
  let status = payload.status ? ensureEnumValue(ApplicationStatus, payload.status, 'status') : application.status;

  if (stage === ApplicationStage.REJECTED) {
    status = ApplicationStatus.REJECTED;
  }

  if (stage === ApplicationStage.HIRED) {
    status = ApplicationStatus.HIRED;
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      stage,
      kanbanOrder: payload.kanbanOrder !== undefined
        ? Number(payload.kanbanOrder)
        : (stage !== application.stage
          ? ((await prisma.application.aggregate({
            where: {
              tenantId,
              stage,
              id: { not: applicationId },
            },
            _max: { kanbanOrder: true },
          }))._max.kanbanOrder || 0) + 1
          : undefined),
      status,
      score: payload.score !== undefined ? parseOptionalDecimal(payload.score, 'score') : undefined,
      rejectionReason: payload.rejectionReason !== undefined ? payload.rejectionReason?.trim() || null : undefined,
      notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
      lastStageAt: new Date(),
    },
    include: applicationInclude,
  });

  return updatedApplication;
}

async function moveApplicationKanbanPosition(applicationId, payload, tenantId) {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      tenantId,
    },
    include: {
      candidate: true,
    },
  });

  if (!application) {
    throw new AppError(404, 'Candidature introuvable.');
  }

  const targetStage = payload.stage ? ensureEnumValue(ApplicationStage, payload.stage, 'stage') : application.stage;
  const beforeApplicationId = payload.beforeApplicationId ? String(payload.beforeApplicationId) : null;

  const [sourceStageApplications, targetStageApplications] = await Promise.all([
    prisma.application.findMany({
      where: {
        tenantId,
        stage: application.stage,
        id: { not: applicationId },
      },
      orderBy: [
        { kanbanOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      select: { id: true },
    }),
    prisma.application.findMany({
      where: {
        tenantId,
        stage: targetStage,
        id: { not: applicationId },
      },
      orderBy: [
        { kanbanOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      select: { id: true },
    }),
  ]);

  const sourceIds = sourceStageApplications.map((item) => item.id);
  const targetIds = targetStageApplications.map((item) => item.id);

  const insertIndex = beforeApplicationId ? targetIds.indexOf(beforeApplicationId) : -1;
  if (beforeApplicationId && insertIndex === -1) {
    throw new AppError(400, 'Position de destination invalide.');
  }

  const nextTargetIds = [...targetIds];
  if (insertIndex >= 0) {
    nextTargetIds.splice(insertIndex, 0, applicationId);
  } else {
    nextTargetIds.push(applicationId);
  }

  const updates = [];

  sourceIds.forEach((id, index) => {
    updates.push(
      prisma.application.update({
        where: { id },
        data: {
          stage: application.stage,
          kanbanOrder: index + 1,
        },
      }),
    );
  });

  nextTargetIds.forEach((id, index) => {
    updates.push(
      prisma.application.update({
        where: { id },
        data: {
          stage: targetStage,
          kanbanOrder: index + 1,
          ...(id === applicationId ? { lastStageAt: new Date() } : {}),
        },
      }),
    );
  });

  await prisma.$transaction(updates);

  return prisma.application.findFirst({
    where: {
      id: applicationId,
      tenantId,
    },
    include: applicationInclude,
  });
}

async function scheduleInterview(payload, tenantId) {
  if (!payload.applicationId || !payload.scheduledAt) {
    throw new AppError(400, 'applicationId et scheduledAt sont obligatoires.');
  }

  const application = await prisma.application.findFirst({
    where: {
      id: payload.applicationId,
      tenantId,
    },
    select: { id: true },
  });

  if (!application) {
    throw new AppError(404, 'Candidature introuvable.');
  }

  const createdInterview = await prisma.interview.create({
    data: {
      tenantId,
      applicationId: payload.applicationId,
      interviewerId: await ensureUserExists(payload.interviewerId, 'interviewerId', tenantId),
      type: ensureEnumValue(InterviewType, payload.type, 'type'),
      status: payload.status ? ensureEnumValue(InterviewStatus, payload.status, 'status') : InterviewStatus.SCHEDULED,
      scheduledAt: parseDate(payload.scheduledAt, 'scheduledAt'),
      location: payload.location?.trim() || null,
      meetingLink: payload.meetingLink?.trim() || null,
      feedback: payload.feedback?.trim() || null,
      score: parseOptionalDecimal(payload.score, 'score'),
      completedAt: payload.completedAt ? parseDate(payload.completedAt, 'completedAt') : null,
    },
    include: {
      application: {
        select: {
          id: true,
          stage: true,
          status: true,
        },
      },
      interviewer: { select: userSummarySelect },
    },
  });

  return createdInterview;
}

async function listInterviews(filters = {}, tenantId) {
  const where = {
    tenantId,
  };

  if (filters.applicationId) {
    where.applicationId = filters.applicationId;
  }

  if (filters.status) {
    where.status = ensureEnumValue(InterviewStatus, filters.status, 'status');
  }

  const { page, limit, skip, take } = parsePagination(filters);

  const [totalItems, items] = await Promise.all([
    prisma.interview.count({ where }),
    prisma.interview.findMany({
      where,
      skip,
      take,
      include: interviewInclude,
      orderBy: {
        scheduledAt: 'desc',
      },
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function updateInterview(interviewId, payload, tenantId) {
  const existingInterview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      tenantId,
    },
  });

  if (!existingInterview) {
    throw new AppError(404, 'Entretien introuvable.');
  }

  const nextStatus = payload.status
    ? ensureEnumValue(InterviewStatus, payload.status, 'status')
    : existingInterview.status;

  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      interviewerId: payload.interviewerId !== undefined ? await ensureUserExists(payload.interviewerId, 'interviewerId', tenantId) : undefined,
      type: payload.type ? ensureEnumValue(InterviewType, payload.type, 'type') : undefined,
      status: nextStatus,
      scheduledAt: payload.scheduledAt !== undefined ? parseDate(payload.scheduledAt, 'scheduledAt') : undefined,
      completedAt: payload.completedAt !== undefined
        ? parseDate(payload.completedAt, 'completedAt')
        : ([InterviewStatus.COMPLETED].includes(nextStatus) && !existingInterview.completedAt ? new Date() : undefined),
      location: payload.location !== undefined ? payload.location?.trim() || null : undefined,
      meetingLink: payload.meetingLink !== undefined ? payload.meetingLink?.trim() || null : undefined,
      feedback: payload.feedback !== undefined ? payload.feedback?.trim() || null : undefined,
      score: payload.score !== undefined ? parseOptionalDecimal(payload.score, 'score') : undefined,
    },
    include: interviewInclude,
  });

  return updatedInterview;
}

async function createOffer(payload, tenantId) {
  if (!payload.applicationId) {
    throw new AppError(400, 'applicationId est obligatoire.');
  }

  const application = await prisma.application.findFirst({
    where: {
      id: payload.applicationId,
      tenantId,
    },
    include: {
      offer: true,
    },
  });

  if (!application) {
    throw new AppError(404, 'Candidature introuvable.');
  }

  if (application.offer) {
    throw new AppError(409, 'Une offre existe deja pour cette candidature.');
  }

  const status = payload.status ? ensureEnumValue(OfferStatus, payload.status, 'status') : OfferStatus.DRAFT;
  const now = new Date();

  const createdOffer = await prisma.$transaction(async (tx) => {
    const offer = await tx.hiringOffer.create({
      data: {
        tenantId,
        applicationId: payload.applicationId,
        salaryAmount: parseOptionalDecimal(payload.salaryAmount, 'salaryAmount'),
        currency: payload.currency?.trim() || null,
        proposedStartDate: parseDate(payload.proposedStartDate, 'proposedStartDate'),
        status,
        notes: payload.notes?.trim() || null,
        sentAt: status === OfferStatus.SENT ? now : null,
      },
      include: offerInclude,
    });

    await tx.application.update({
      where: { id: payload.applicationId },
      data: {
        stage: ApplicationStage.OFFER,
        status: ApplicationStatus.ACTIVE,
        lastStageAt: now,
      },
    });

    return offer;
  });

  return createdOffer;
}

async function listOffers(params = {}, tenantId) {
  const { page, limit, skip, take } = parsePagination(params);
  const [totalItems, items] = await Promise.all([
    prisma.hiringOffer.count({
      where: {
        tenantId,
      },
    }),
    prisma.hiringOffer.findMany({
      where: {
        tenantId,
      },
      skip,
      take,
      include: offerInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function updateOfferStatus(offerId, payload, tenantId) {
  const existingOffer = await prisma.hiringOffer.findFirst({
    where: {
      id: offerId,
      tenantId,
    },
  });

  if (!existingOffer) {
    throw new AppError(404, 'Offre d embauche introuvable.');
  }

  const status = ensureEnumValue(OfferStatus, payload.status, 'status');
  const now = new Date();

  const updatedOffer = await prisma.$transaction(async (tx) => {
    const offer = await tx.hiringOffer.update({
      where: { id: offerId },
      data: {
        status,
        notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
        sentAt: status === OfferStatus.SENT && !existingOffer.sentAt ? now : existingOffer.sentAt,
        respondedAt: [OfferStatus.ACCEPTED, OfferStatus.REJECTED].includes(status) ? now : existingOffer.respondedAt,
      },
      include: offerInclude,
    });

    if (status === OfferStatus.ACCEPTED) {
      await tx.application.update({
        where: { id: existingOffer.applicationId },
        data: {
          stage: ApplicationStage.HIRED,
          status: ApplicationStatus.HIRED,
          lastStageAt: now,
        },
      });
    }

    if (status === OfferStatus.REJECTED) {
      await tx.application.update({
        where: { id: existingOffer.applicationId },
        data: {
          stage: ApplicationStage.REJECTED,
          status: ApplicationStatus.REJECTED,
          lastStageAt: now,
          rejectionReason: payload.notes?.trim() || 'Offre rejetee',
        },
      });
    }

    return offer;
  });

  return updatedOffer;
}

async function createOnboardingPlan(payload, tenantId) {
  if (!payload.applicationId) {
    throw new AppError(400, 'applicationId est obligatoire.');
  }

  const application = await prisma.application.findFirst({
    where: {
      id: payload.applicationId,
      tenantId,
    },
    include: {
      offer: true,
      onboardingPlan: true,
    },
  });

  if (!application) {
    throw new AppError(404, 'Candidature introuvable.');
  }

  if (application.onboardingPlan) {
    throw new AppError(409, 'Un plan d onboarding existe deja pour cette candidature.');
  }

  if (Array.isArray(payload.tasks)) {
    payload.tasks.forEach((task, index) => {
      if (!String(task.title || '').trim()) {
        throw new AppError(400, `title est obligatoire pour tasks[${index}].`);
      }
    });
  }

  const createdPlan = await prisma.onboardingPlan.create({
    data: {
      tenantId,
      applicationId: payload.applicationId,
      status: payload.status ? ensureEnumValue(OnboardingStatus, payload.status, 'status') : OnboardingStatus.NOT_STARTED,
      startDate: parseDate(payload.startDate, 'startDate'),
      departmentName: payload.departmentName?.trim() || null,
      siteName: payload.siteName?.trim() || null,
      managerName: payload.managerName?.trim() || null,
      notes: payload.notes?.trim() || null,
      tasks: Array.isArray(payload.tasks) && payload.tasks.length
        ? {
            create: payload.tasks.map((task) => ({
              title: String(task.title || '').trim(),
              description: task.description?.trim() || null,
              ownerLabel: task.ownerLabel?.trim() || null,
              dueDate: parseDate(task.dueDate, 'tasks.dueDate'),
            })),
          }
        : undefined,
    },
    include: onboardingPlanInclude,
  });

  return createdPlan;
}

async function listOnboardingPlans(params = {}, tenantId) {
  const { page, limit, skip, take } = parsePagination(params);
  const [totalItems, items] = await Promise.all([
    prisma.onboardingPlan.count({
      where: {
        tenantId,
      },
    }),
    prisma.onboardingPlan.findMany({
      where: {
        tenantId,
      },
      skip,
      take,
      include: onboardingPlanInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

async function getTalentDashboard(tenantId) {
  const [
    recruitmentRequestCounts,
    jobPostingCounts,
    candidateCount,
    applicationCounts,
    offerCounts,
    onboardingCounts,
    recentApplications,
  ] = await Promise.all([
    prisma.recruitmentRequest.groupBy({
      where: {
        tenantId,
      },
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.jobPosting.groupBy({
      where: {
        tenantId,
      },
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.candidate.count({
      where: {
        tenantId,
      },
    }),
    prisma.application.groupBy({
      where: {
        tenantId,
      },
      by: ['stage', 'status'],
      _count: { _all: true },
    }),
    prisma.hiringOffer.groupBy({
      where: {
        tenantId,
      },
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.onboardingPlan.groupBy({
      where: {
        tenantId,
      },
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.application.findMany({
      where: {
        tenantId,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    }),
  ]);

  return {
    recruitmentRequests: recruitmentRequestCounts,
    jobPostings: jobPostingCounts,
    candidateCount,
    applications: applicationCounts,
    offers: offerCounts,
    onboarding: onboardingCounts,
    recentApplications,
  };
}

async function addOnboardingTask(planId, payload, tenantId) {
  if (!payload.title?.trim()) {
    throw new AppError(400, 'title est obligatoire.');
  }

  const plan = await prisma.onboardingPlan.findFirst({
    where: {
      id: planId,
      tenantId,
    },
    select: { id: true },
  });

  if (!plan) {
    throw new AppError(404, 'Plan d onboarding introuvable.');
  }

  const taskStatus = payload.status
    ? ensureEnumValue(OnboardingTaskStatus, payload.status, 'status')
    : OnboardingTaskStatus.TODO;

  const task = await prisma.onboardingTask.create({
    data: {
      onboardingPlanId: planId,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      ownerLabel: payload.ownerLabel?.trim() || null,
      dueDate: parseDate(payload.dueDate, 'dueDate'),
      status: taskStatus,
      completedAt: taskStatus === OnboardingTaskStatus.DONE ? new Date() : null,
    },
  });

  return task;
}

async function updateOnboardingTaskStatus(taskId, payload, tenantId) {
  const task = await prisma.onboardingTask.findFirst({
    where: {
      id: taskId,
      onboardingPlan: {
        is: {
          tenantId,
        },
      },
    },
  });

  if (!task) {
    throw new AppError(404, 'Tache d onboarding introuvable.');
  }

  const status = ensureEnumValue(OnboardingTaskStatus, payload.status, 'status');
  const updatedTask = await prisma.onboardingTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === OnboardingTaskStatus.DONE ? new Date() : null,
    },
  });

  const siblingTasks = await prisma.onboardingTask.findMany({
    where: {
      onboardingPlanId: task.onboardingPlanId,
    },
    select: {
      status: true,
    },
  });

  const allDone = siblingTasks.every((item) => item.status === OnboardingTaskStatus.DONE);

  await prisma.onboardingPlan.update({
    where: { id: task.onboardingPlanId },
    data: {
      status: allDone ? OnboardingStatus.COMPLETED : OnboardingStatus.IN_PROGRESS,
    },
  });

  return updatedTask;
}

async function uploadTalentDocument(payload, actorId, tenantId) {
  const { file, ownerType, ownerId, title, category } = payload;

  if (!file) {
    throw new AppError(400, 'Fichier requis.');
  }

  const normalizedOwnerType = ensureEnumValue(TalentDocumentOwnerType, ownerType, 'ownerType');
  const normalizedCategory = category
    ? ensureEnumValue(TalentDocumentCategory, category, 'category')
    : TalentDocumentCategory.OTHER;

  const candidateId = normalizedOwnerType === TalentDocumentOwnerType.CANDIDATE ? ownerId : null;
  const onboardingPlanId = normalizedOwnerType === TalentDocumentOwnerType.ONBOARDING ? ownerId : null;

  if (!ownerId) {
    throw new AppError(400, 'ownerId est obligatoire.');
  }

  if (candidateId) {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        tenantId,
      },
      select: { id: true },
    });

    if (!candidate) {
      throw new AppError(404, 'Candidat introuvable pour ce document.');
    }
  }

  if (onboardingPlanId) {
    const onboardingPlan = await prisma.onboardingPlan.findFirst({
      where: {
        id: onboardingPlanId,
        tenantId,
      },
      select: { id: true },
    });

    if (!onboardingPlan) {
      throw new AppError(404, 'Plan d onboarding introuvable pour ce document.');
    }
  }

  const document = await prisma.talentDocument.create({
    data: {
      tenantId,
      ownerType: normalizedOwnerType,
      category: normalizedCategory,
      candidateId,
      onboardingPlanId,
      uploadedById: actorId,
      title: title?.trim() || file.originalname,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype || null,
      sizeBytes: file.size,
      storagePath: file.path,
      publicUrl: `/uploads/talent/${file.filename}`,
    },
    include: talentDocumentInclude,
  });

  return document;
}

async function listTalentDocuments(filters = {}, tenantId) {
  const where = {
    tenantId,
  };

  if (filters.ownerType) {
    where.ownerType = ensureEnumValue(TalentDocumentOwnerType, filters.ownerType, 'ownerType');
  }

  if (filters.candidateId) {
    where.candidateId = filters.candidateId;
  }

  if (filters.onboardingPlanId) {
    where.onboardingPlanId = filters.onboardingPlanId;
  }

  if (filters.category) {
    where.category = ensureEnumValue(TalentDocumentCategory, filters.category, 'category');
  }

  const { page, limit, skip, take } = parsePagination(filters);

  const [totalItems, items] = await Promise.all([
    prisma.talentDocument.count({ where }),
    prisma.talentDocument.findMany({
      where,
      skip,
      take,
      include: talentDocumentInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, totalItems),
  };
}

module.exports = {
  addOnboardingTask,
  createApplication,
  createCandidate,
  createJobPosting,
  createOffer,
  createOnboardingPlan,
  createRecruitmentRequest,
  getTalentDashboard,
  listApplications,
  listCandidates,
  listTalentDocuments,
  listInterviews,
  listJobPostings,
  moveApplicationKanbanPosition,
  listOffers,
  listOnboardingPlans,
  listRecruitmentRequests,
  scheduleInterview,
  updateCandidate,
  updateInterview,
  updateJobPosting,
  updateApplicationStage,
  updateOfferStatus,
  updateOnboardingTaskStatus,
  updateRecruitmentRequestStatus,
  uploadTalentDocument,
};
