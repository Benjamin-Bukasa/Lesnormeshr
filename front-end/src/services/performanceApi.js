const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function scoreToBand(score) {
  const normalized = Number(score || 0);

  if (normalized >= 90) return 'A';
  if (normalized >= 80) return 'B';
  if (normalized >= 65) return 'C';
  if (normalized >= 50) return 'D';
  return 'E';
}

function splitTextList(value) {
  return String(value || '')
    .split(/\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) {
    return 'Non planifie';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }

    query.set(key, String(value));
  });

  const suffix = query.toString();
  return suffix ? `?${suffix}` : '';
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Erreur API');
  }

  return payload;
}

async function fetchCollection(path, params = {}) {
  const payload = await apiRequest(`${path}${buildQuery({ page: 1, limit: 100, ...params })}`);
  return {
    data: payload.data || [],
    pagination: payload.pagination || null,
  };
}

function mapCycleToCampaign(cycle, reviews = [], goals = []) {
  const cycleReviews = reviews.filter((item) => item.cycle?.id === cycle.id);
  const cycleGoals = goals.filter((item) => item.cycle?.id === cycle.id);
  const participantIds = new Set([
    ...cycleReviews.map((item) => item.reviewee?.id).filter(Boolean),
    ...cycleGoals.map((item) => item.employee?.id).filter(Boolean),
  ]);
  const selfReviews = cycleReviews.filter((item) => normalize(item.reviewType) === 'self');
  const managerReviews = cycleReviews.filter((item) => ['manager', 'review_360'].includes(normalize(item.reviewType)));
  const completedReviews = cycleReviews.filter((item) => normalize(item.status) === 'completed');
  const completedGoals = cycleGoals.filter((item) => normalize(item.status) === 'completed');

  const selfCompletion = selfReviews.length
    ? Math.round((selfReviews.filter((item) => ['submitted', 'completed'].includes(normalize(item.status))).length / selfReviews.length) * 100)
    : 0;
  const managerCompletion = managerReviews.length
    ? Math.round((managerReviews.filter((item) => ['submitted', 'completed'].includes(normalize(item.status))).length / managerReviews.length) * 100)
    : 0;
  const calibrationCompletion = cycleReviews.length
    ? Math.round((completedReviews.length / cycleReviews.length) * 100)
    : 0;
  const finalizationCompletion = cycleGoals.length
    ? Math.round((completedGoals.length / cycleGoals.length) * 100)
    : 0;

  const phaseMap = {
    draft: 'Preparation',
    active: 'Execution',
    closed: 'Cloture',
    archived: 'Archive',
  };

  return {
    id: cycle.id,
    code: cycle.code,
    name: cycle.name,
    cycle: cycle.id,
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
    direction: 'all',
    manager: 'all',
    phase: phaseMap[normalize(cycle.status)] || cycle.status,
    status: cycle.status,
    participants: participantIds.size,
    selfCompletion,
    managerCompletion,
    calibrationCompletion,
    finalizationCompletion,
    deadline: formatDate(cycle.periodEnd),
    owner: 'Performance 360',
    description: cycle.description || 'Campagne de performance.',
    raw: cycle,
    milestones: [
      { label: 'Objectifs valides', status: completedGoals.length ? 'Completed' : 'Draft', value: `${finalizationCompletion} %` },
      { label: 'Autoevaluations', status: selfCompletion >= 100 ? 'Completed' : selfCompletion > 0 ? 'In progress' : 'Draft', value: `${selfCompletion} %` },
      { label: 'Revue manager', status: managerCompletion >= 100 ? 'Completed' : managerCompletion > 0 ? 'In progress' : 'Draft', value: `${managerCompletion} %` },
      { label: 'Calibration', status: calibrationCompletion >= 100 ? 'Completed' : calibrationCompletion > 0 ? 'Active' : 'Draft', value: `${calibrationCompletion} %` },
    ],
  };
}

function mapReviewToUi(review) {
  const score = Number(review.overallScore || 0);
  return {
    id: review.id,
    cycle: review.cycle?.id || null,
    employee: review.reviewee?.fullName || 'Collaborateur',
    direction: review.reviewee?.department?.name || 'Non renseignee',
    manager: review.reviewer?.fullName || 'Non renseigne',
    reviewType: review.reviewType,
    score,
    band: scoreToBand(score),
    status: review.status,
    nextAction:
      normalize(review.status) === 'draft' ? 'Finaliser la revue'
        : normalize(review.status) === 'submitted' ? 'Calibration comite'
          : score < 65 ? 'Suivi PIP'
            : 'Validation finale',
    dueDate: formatDate(review.completedAt || review.submittedAt || review.createdAt),
    strengths: splitTextList(review.strengths),
    developmentAreas: splitTextList(review.developmentAreas),
    summary: review.comments || 'Evaluation en cours de traitement.',
    reviewers: [review.reviewee?.fullName, review.reviewer?.fullName].filter(Boolean),
    raw: review,
  };
}

function mapGoalToUi(goal) {
  return {
    id: goal.id,
    cycle: goal.cycle?.id || null,
    employee: goal.employee?.fullName || 'Collaborateur',
    employeeId: goal.employee?.id || null,
    direction: goal.employee?.department?.name || 'Non renseignee',
    manager: goal.employee?.manager?.fullName || 'Non renseigne',
    kpiCode: goal.kpiDefinition?.code || 'N/A',
    title: goal.title,
    targetValue: goal.targetValue || 'Non defini',
    achievedValue: goal.achievedValue || '0',
    progressPercent: Number(goal.progressPercent || 0),
    weight: Number(goal.weight || 0),
    status: goal.status,
    dueDate: formatDate(goal.dueDate),
    note: goal.note || goal.description || '',
    raw: goal,
  };
}

function mapFeedbackToUi(feedback) {
  return {
    id: feedback.id,
    cycle: feedback.cycle?.id || null,
    author: feedback.author?.fullName || 'Anonyme',
    receiver: feedback.receiver?.fullName || 'Collaborateur',
    receiverId: feedback.receiver?.id || null,
    authorId: feedback.author?.id || null,
    direction: feedback.receiver?.department?.name || 'Non renseignee',
    manager: feedback.receiver?.manager?.fullName || 'Non renseigne',
    feedbackType: feedback.feedbackType,
    title: feedback.title || 'Feedback',
    message: feedback.message || '',
    rating: feedback.rating || null,
    isAnonymous: Boolean(feedback.isAnonymous),
    createdAt: feedback.createdAt,
    raw: feedback,
  };
}

function mapTrainingToAction(training) {
  return {
    id: training.id,
    title: training.title,
    owner: training.provider || 'Academie RH',
    dueDate: formatDate(training.endDate || training.startDate),
    status: training.status,
  };
}

function mapTrainingToUi(training) {
  return {
    id: training.id,
    cycle: training.cycle?.id || null,
    employee: training.employee?.fullName || 'Collaborateur',
    employeeId: training.employee?.id || null,
    direction: training.employee?.department?.name || 'Non renseignee',
    manager: training.employee?.manager?.fullName || 'Non renseigne',
    title: training.title,
    provider: training.provider || 'Academie RH',
    startDate: training.startDate,
    endDate: training.endDate,
    status: training.status,
    hours: Number(training.hours || 0),
    score: Number(training.score || 0),
    notes: training.notes || '',
    raw: training,
  };
}

function derivePips(reviews = [], trainings = []) {
  return reviews
    .filter((item) => ['D', 'E'].includes(item.band))
    .map((review) => {
      const employeeTrainings = trainings.filter(
        (training) => (training.employeeId || training.employee?.id) === review.raw.reviewee?.id,
      );
      const averageProgress = employeeTrainings.length
        ? Math.round(
            employeeTrainings.reduce((sum, item) => {
              if (normalize(item.status) === 'completed') return sum + 100;
              if (normalize(item.status) === 'in_progress') return sum + 50;
              return sum;
            }, 0) / employeeTrainings.length,
          )
        : 0;

      return {
        id: `pip-${review.id}`,
        cycle: review.cycle,
        employeeId: review.employeeId,
        employee: review.employee,
        direction: review.direction,
        manager: review.manager,
        initialBand: review.band,
        status: averageProgress >= 100 ? 'Completed' : averageProgress > 0 ? 'Active' : 'At risk',
        progress: averageProgress,
        durationLabel: review.band === 'E' ? '6 mois' : '12 mois',
        nextReview: formatDate(review.raw.completedAt || review.raw.submittedAt),
        mentoring: review.band === 'D' ? 'Oui' : 'Non',
        coaching: review.band === 'E' ? 'Oui' : 'Non',
        focus: review.developmentAreas.join(', ') || 'Renforcement du niveau de performance.',
        primaryTrainingId: employeeTrainings[0]?.id || null,
        trainingIds: employeeTrainings.map((item) => item.id),
        actions: employeeTrainings.length ? employeeTrainings.map(mapTrainingToAction) : [
          {
            id: null,
            title: 'Definir le plan de developpement',
            owner: 'Manager + RH',
            dueDate: formatDate(review.raw.submittedAt || review.raw.createdAt),
            status: 'Planned',
          },
        ],
      };
    });
}

function deriveRewards(reviews = []) {
  return reviews
    .filter((item) => Number.isFinite(item.score) && item.score > 0)
    .map((review) => {
      const baseAmount = 1600;
      const gratificationPercent = {
        A: 200,
        B: 150,
        C: 100,
        D: 50,
        E: 0,
      }[review.band] || 0;
      const gratificationAmount = Math.round((baseAmount * gratificationPercent) / 100);
      const bonusAmount = review.band === 'A' ? 1200 : review.band === 'B' ? 600 : 0;
      const meritPrimeAmount = review.band === 'C' ? 300 : 0;

      return {
        id: `reward-${review.id}`,
        cycle: review.cycle,
        employee: review.employee,
        direction: review.direction,
        manager: review.manager,
        score: review.score,
        band: review.band,
        gratificationPercent,
        gratificationAmount,
        bonusAmount,
        meritPrimeAmount,
        status: normalize(review.status) === 'completed' ? 'Validated' : 'Pending',
        commentary:
          review.band === 'A' ? 'Profil prioritaire pour promotion et bonus.'
            : review.band === 'D' || review.band === 'E' ? 'Versement conditionne au suivi de performance.'
              : 'Dossier en attente de validation finale.',
        components: [
          { label: 'Gratification', amount: gratificationAmount },
          { label: 'Bonus performance', amount: bonusAmount },
          { label: 'Prime de merite', amount: meritPrimeAmount },
        ],
      };
    });
}

function deriveHighlights(reviews = []) {
  return reviews
    .filter((item) => item.score > 0)
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((review) => ({
      id: `highlight-${review.id}`,
      employee: review.employee,
      role: review.direction,
      direction: review.direction,
      score: review.score,
      band: review.band,
      insight: review.strengths[0] || review.summary || 'Resultat remarquable sur la campagne.',
    }));
}

function deriveUpcomingActions(campaigns = [], reviews = [], pips = []) {
  const items = [];

  campaigns
    .filter((campaign) => normalize(campaign.status) !== 'closed' && normalize(campaign.status) !== 'archived')
    .slice(0, 2)
    .forEach((campaign) => {
      items.push({
        id: `campaign-action-${campaign.id}`,
        title: `Suivre la campagne ${campaign.code}`,
        owner: campaign.owner,
        dueDate: campaign.deadline,
        priority: campaign.calibrationCompletion < 50 ? 'High' : 'Medium',
      });
    });

  pips.slice(0, 2).forEach((pip) => {
    items.push({
      id: `pip-action-${pip.id}`,
      title: `Revoir le plan de ${pip.employee}`,
      owner: pip.manager,
      dueDate: pip.nextReview,
      priority: normalize(pip.status) === 'at risk' ? 'High' : 'Medium',
    });
  });

  reviews
    .filter((review) => normalize(review.status) !== 'completed')
    .slice(0, 2)
    .forEach((review) => {
      items.push({
        id: `review-action-${review.id}`,
        title: `Finaliser l evaluation de ${review.employee}`,
        owner: review.manager,
        dueDate: review.dueDate,
        priority: review.band === 'D' || review.band === 'E' ? 'High' : 'Low',
      });
    });

  return items.slice(0, 4);
}

function mapKpiDefinitionToUi(definition) {
  return {
    id: definition.id,
    code: definition.code,
    name: definition.name,
    scope: definition.scope,
    direction: slugify(definition.directionName || 'all'),
    manager: slugify(definition.managerEmployee?.fullName || 'all'),
    metricType: definition.metricType,
    unit: definition.unit || '',
    defaultWeight: Number(definition.defaultWeight || 0),
    owner: definition.ownerLabel || 'Non renseigne',
    status: definition.status,
    description: definition.description || '',
    raw: definition,
  };
}

function mapKpiAssignmentToUi(assignment) {
  return {
    id: assignment.id,
    cycle: assignment.cycle?.id || null,
    employee: assignment.employee?.fullName || 'Collaborateur',
    employeeId: assignment.employee?.id || null,
    direction: assignment.employee?.department?.name || 'Non renseignee',
    manager: assignment.managerEmployee?.fullName || assignment.employee?.manager?.fullName || 'Non renseigne',
    assignedKpis: assignment.assignedKpis,
    totalWeight: Number(assignment.totalWeight || 0),
    completion: Number(assignment.completionPercent || 0),
    riskLevel: assignment.riskLevel,
    status: assignment.status,
    summary: assignment.summary || 'Portefeuille KPI en cours de structuration.',
    raw: assignment,
  };
}

function mapCheckInToUi(checkIn) {
  return {
    id: checkIn.id,
    cycle: checkIn.goal?.cycle?.id || null,
    employee: checkIn.goal?.employee?.fullName || 'Collaborateur',
    direction: checkIn.goal?.employee?.department?.name || 'Non renseignee',
    manager: checkIn.goal?.employee?.manager?.fullName || 'Non renseigne',
    title: checkIn.title,
    goalTitle: checkIn.goal?.title || 'Objectif',
    progressPercent: Number(checkIn.progressPercent || 0),
    blocker: checkIn.blocker || 'Aucun blocker remonte.',
    supportNeeded: checkIn.supportNeeded || 'Aucun support particulier.',
    nextActions: checkIn.nextActions || 'Aucune action definie.',
    checkInDate: formatDate(checkIn.checkInDate),
    status: checkIn.status,
    raw: checkIn,
  };
}

async function fetchPerformanceBase(filters = {}, access = {}) {
  const query = {
    search: filters.search,
    cycleId: filters.cycle,
  };

  const {
    canReadDashboard = true,
    canReadCycles = true,
    canReadReviews = true,
    canReadGoals = true,
    canReadTrainings = true,
    canReadFeedbacks = true,
  } = access;

  const emptyCollection = Promise.resolve({ data: [], pagination: null });
  const emptyDashboard = Promise.resolve({ data: { scoreBands: { A: 0, B: 0, C: 0, D: 0, E: 0 } } });

  const [
    dashboardPayload,
    cyclesPayload,
    reviewsPayload,
    goalsPayload,
    trainingsPayload,
    feedbacksPayload,
  ] = await Promise.all([
    canReadDashboard ? apiRequest('/api/performance/dashboard') : emptyDashboard,
    canReadCycles ? fetchCollection('/api/performance/cycles', { search: filters.search }) : emptyCollection,
    canReadReviews ? fetchCollection('/api/performance/reviews', query) : emptyCollection,
    canReadGoals ? fetchCollection('/api/performance/goals', query) : emptyCollection,
    canReadTrainings ? fetchCollection('/api/performance/trainings', query) : emptyCollection,
    canReadFeedbacks ? fetchCollection('/api/performance/feedbacks', query) : emptyCollection,
  ]);

  const goals = goalsPayload.data.map(mapGoalToUi).filter((item) => {
    const directionMatch = !filters.direction || filters.direction === 'all' || slugify(item.direction) === filters.direction;
    const managerMatch = !filters.manager || filters.manager === 'all' || slugify(item.manager) === filters.manager;
    return directionMatch && managerMatch;
  });

  const reviews = reviewsPayload.data.map(mapReviewToUi).filter((item) => {
    const directionMatch = !filters.direction || filters.direction === 'all' || slugify(item.direction) === filters.direction;
    const managerMatch = !filters.manager || filters.manager === 'all' || slugify(item.manager) === filters.manager;
    return directionMatch && managerMatch;
  });

  const trainings = trainingsPayload.data.filter((item) => {
    const directionMatch = !filters.direction || filters.direction === 'all' || slugify(item.employee?.department?.name) === filters.direction;
    const managerMatch = !filters.manager || filters.manager === 'all' || slugify(item.employee?.manager?.fullName) === filters.manager;
    return directionMatch && managerMatch;
  });

  const trainingRows = trainings.map(mapTrainingToUi);

  const campaigns = cyclesPayload.data.map((cycle) => mapCycleToCampaign(cycle, reviewsPayload.data.map(mapReviewToUi), goalsPayload.data.map(mapGoalToUi)));
  const pips = derivePips(reviews, trainingRows);
  const rewards = deriveRewards(reviews);

  return {
    dashboard: dashboardPayload.data,
    campaigns,
    reviews,
    goals,
    trainings: trainingRows,
    feedbacks: feedbacksPayload.data
      .map(mapFeedbackToUi)
      .filter((item) => {
        const directionMatch = !filters.direction || filters.direction === 'all' || slugify(item.direction) === filters.direction;
        const managerMatch = !filters.manager || filters.manager === 'all' || slugify(item.manager) === filters.manager;
        return directionMatch && managerMatch;
      }),
    pips,
    rewards,
  };
}

export async function getPerformanceFilterOptions() {
  const payload = await apiRequest('/api/performance/options');
  return {
    cycles: [{ value: 'all', label: 'Toutes les campagnes' }, ...(payload.data.cycles || [])],
    directions: [{ value: 'all', label: 'Toutes les directions' }, ...(payload.data.directions || []).map((item) => ({
      value: slugify(item.label),
      label: item.label,
      originalValue: item.value,
    }))],
    managers: [{ value: 'all', label: 'Tous les managers' }, ...(payload.data.managers || []).map((item) => ({
      value: slugify(item.label),
      label: item.label,
      originalValue: item.value,
    }))],
    employees: payload.data.employees || [],
  };
}

export async function getPerformanceDashboard(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  const distribution = base.dashboard.scoreBands || { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const totalDistribution = Object.values(distribution).reduce((sum, value) => sum + Number(value || 0), 0);
  const projectedRewards = base.rewards.reduce(
    (sum, item) => sum + item.gratificationAmount + item.bonusAmount + item.meritPrimeAmount,
    0,
  );

  return {
    activeCampaign: base.campaigns.find((item) => normalize(item.status) === 'active') || base.campaigns[0] || null,
    campaigns: base.campaigns,
    reviews: base.reviews,
    pips: base.pips,
    rewards: base.rewards,
    highlights: deriveHighlights(base.reviews),
    upcomingActions: deriveUpcomingActions(base.campaigns, base.reviews, base.pips),
    summary: {
      pendingReviewsCount: base.reviews.filter((item) => normalize(item.status) !== 'completed').length,
      openPipsCount: base.pips.filter((item) => ['active', 'at risk'].includes(normalize(item.status))).length,
      projectedRewards,
      rewardValidationRate: base.rewards.length
        ? Math.round((base.rewards.filter((item) => normalize(item.status) === 'validated').length / base.rewards.length) * 100)
        : 0,
      distribution,
      totalDistribution,
    },
  };
}

export async function getPerformanceCampaigns(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  return base.campaigns;
}

export async function getPerformanceReviews(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  return base.reviews;
}

export async function getPerformanceGoals(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  return base.goals;
}

export async function getPerformancePips(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  return base.pips;
}

export async function getPerformanceRewards(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  return base.rewards;
}

export async function getPerformanceTrainings(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  return base.trainings;
}

export async function getPerformanceFeedbacks(filters = {}, access = {}) {
  const base = await fetchPerformanceBase(filters, access);
  return base.feedbacks;
}

export async function createPerformanceCampaign(body) {
  const payload = await apiRequest('/api/performance/cycles', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function launchCalibrationWorkflow({ campaignId }) {
  const payload = await apiRequest(`/api/performance/cycles/${campaignId}`, {
    method: 'PATCH',
    body: {
      status: 'ACTIVE',
    },
  });
  return payload.data;
}

export async function updatePerformanceCampaign(campaignId, body) {
  const payload = await apiRequest(`/api/performance/cycles/${campaignId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deletePerformanceCampaign(campaignId) {
  const payload = await apiRequest(`/api/performance/cycles/${campaignId}`, {
    method: 'DELETE',
  });
  return payload.data;
}

export async function createPerformanceReview(body) {
  const payload = await apiRequest('/api/performance/reviews', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updatePerformanceReview(reviewId, body) {
  const payload = await apiRequest(`/api/performance/reviews/${reviewId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deletePerformanceReview(reviewId) {
  const payload = await apiRequest(`/api/performance/reviews/${reviewId}`, {
    method: 'DELETE',
  });
  return payload.data;
}

export async function createPerformanceFeedback(body) {
  const payload = await apiRequest('/api/performance/feedbacks', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function createPerformanceTraining(body) {
  const payload = await apiRequest('/api/performance/trainings', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updatePerformanceTraining(trainingId, body) {
  const payload = await apiRequest(`/api/performance/trainings/${trainingId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deletePerformanceTraining(trainingId) {
  const payload = await apiRequest(`/api/performance/trainings/${trainingId}`, {
    method: 'DELETE',
  });
  return payload.data;
}

export async function getKpiBoardDashboard(filters = {}) {
  const [definitions, assignments, goals, checkIns] = await Promise.all([
    getKpiDefinitions(filters),
    getKpiAssignments(filters),
    getKpiGoals(filters),
    getKpiCheckIns(filters),
  ]);

  const activeKpis = definitions.filter((item) => normalize(item.status) === 'active').length;
  const atRiskGoals = goals.filter((item) => ['at risk', 'on hold'].includes(normalize(item.status))).length;
  const averageCompletion = assignments.length
    ? Math.round(assignments.reduce((sum, item) => sum + item.completion, 0) / assignments.length)
    : 0;
  const completedCheckIns = checkIns.filter((item) => normalize(item.status) === 'done' || normalize(item.status) === 'completed').length;

  const analyticsMap = new Map();
  assignments.forEach((assignment) => {
    const key = assignment.direction;
    const bucket = analyticsMap.get(key) || {
      id: `analytics-${slugify(key)}`,
      direction: assignment.direction,
      completionRate: 0,
      totalCompletion: 0,
      scoreAverage: 0,
      totalScore: 0,
      count: 0,
      atRiskCount: 0,
      topBandShare: 0,
      highCount: 0,
      insight: `Suivi consolide pour ${assignment.direction}.`,
    };

    bucket.count += 1;
    bucket.totalCompletion += assignment.completion;
    if (normalize(assignment.riskLevel) === 'high') {
      bucket.atRiskCount += 1;
    }
    if (assignment.completion >= 85) {
      bucket.highCount += 1;
    }
    analyticsMap.set(key, bucket);
  });

  goals.forEach((goal) => {
    const bucket = analyticsMap.get(goal.direction);
    if (!bucket) {
      return;
    }
    bucket.totalScore += goal.progressPercent;
  });

  const analytics = Array.from(analyticsMap.values()).map((item) => ({
    id: item.id,
    direction: item.direction,
    completionRate: item.count ? Math.round(item.totalCompletion / item.count) : 0,
    scoreAverage: item.count ? Math.round(item.totalScore / item.count) : 0,
    atRiskCount: item.atRiskCount,
    topBandShare: item.count ? Math.round((item.highCount / item.count) * 100) : 0,
    insight: item.insight,
  }));

  const topDirection = analytics.slice().sort((a, b) => b.scoreAverage - a.scoreAverage)[0] || null;

  return {
    definitions,
    assignments,
    goals,
    checkIns,
    analytics,
    summary: {
      activeKpis,
      atRiskGoals,
      averageCompletion,
      completedCheckIns,
      topDirection,
      projectedImpactLabel: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(goals.length * 125),
    },
  };
}

export async function getKpiDefinitions(filters = {}) {
  const payload = await fetchCollection('/api/performance/kpis', { search: filters.search });
  return payload.data
    .map(mapKpiDefinitionToUi)
    .filter((item) => (!filters.direction || filters.direction === 'all' || item.direction === filters.direction))
    .filter((item) => (!filters.manager || filters.manager === 'all' || item.manager === filters.manager));
}

export async function getKpiAssignments(filters = {}) {
  const payload = await fetchCollection('/api/performance/kpi-assignments', {
    cycleId: filters.cycle,
    search: filters.search,
  });
  return payload.data
    .map(mapKpiAssignmentToUi)
    .filter((item) => (!filters.direction || filters.direction === 'all' || slugify(item.direction) === filters.direction))
    .filter((item) => (!filters.manager || filters.manager === 'all' || slugify(item.manager) === filters.manager));
}

export async function getKpiGoals(filters = {}) {
  const payload = await fetchCollection('/api/performance/goals', {
    cycleId: filters.cycle,
    search: filters.search,
  });
  return payload.data
    .map(mapGoalToUi)
    .filter((item) => (!filters.direction || filters.direction === 'all' || slugify(item.direction) === filters.direction))
    .filter((item) => (!filters.manager || filters.manager === 'all' || slugify(item.manager) === filters.manager));
}

export async function getKpiCheckIns(filters = {}) {
  const payload = await fetchCollection('/api/performance/check-ins', { search: filters.search });
  return payload.data
    .map(mapCheckInToUi)
    .filter((item) => (!filters.cycle || filters.cycle === 'all' || item.cycle === filters.cycle))
    .filter((item) => (!filters.direction || filters.direction === 'all' || slugify(item.direction) === filters.direction))
    .filter((item) => (!filters.manager || filters.manager === 'all' || slugify(item.manager) === filters.manager));
}

export async function getKpiAnalytics(filters = {}) {
  const dashboard = await getKpiBoardDashboard(filters);
  return dashboard.analytics;
}

export async function createKpiDefinition(body) {
  const payload = await apiRequest('/api/performance/kpis', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updateKpiDefinition(kpiDefinitionId, body) {
  const payload = await apiRequest(`/api/performance/kpis/${kpiDefinitionId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deleteKpiDefinition(kpiDefinitionId) {
  const payload = await apiRequest(`/api/performance/kpis/${kpiDefinitionId}`, {
    method: 'DELETE',
  });
  return payload.data;
}

export async function createKpiAssignmentWorkflow(body) {
  const assignmentPayload = await apiRequest('/api/performance/kpi-assignments', {
    method: 'POST',
    body: {
      cycleId: body.cycleId,
      employeeId: body.employeeId,
      managerEmployeeId: body.managerEmployeeId,
      summary: body.summary,
      assignedKpis: body.assignedKpis,
      totalWeight: body.totalWeight,
      completionPercent: body.completionPercent,
      riskLevel: body.riskLevel,
      status: body.status || 'Active',
    },
  });

  let goal = null;
  if (body.goalTitle) {
    const goalPayload = await apiRequest('/api/performance/goals', {
      method: 'POST',
      body: {
        cycleId: body.cycleId,
        employeeId: body.employeeId,
        kpiDefinitionId: body.kpiDefinitionId || undefined,
        title: body.goalTitle,
        targetValue: body.targetValue,
        achievedValue: body.achievedValue || '0',
        progressPercent: body.completionPercent || 0,
        weight: body.goalWeight || body.totalWeight,
        dueDate: body.dueDate,
        note: body.goalNote,
        status: body.goalStatus || 'IN_PROGRESS',
      },
    });
    goal = goalPayload.data;
  }

  return {
    assignment: assignmentPayload.data,
    goal,
  };
}

export async function createPerformanceGoal(body) {
  const payload = await apiRequest('/api/performance/goals', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updatePerformanceGoal(goalId, body) {
  const payload = await apiRequest(`/api/performance/goals/${goalId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deletePerformanceGoal(goalId) {
  const payload = await apiRequest(`/api/performance/goals/${goalId}`, {
    method: 'DELETE',
  });
  return payload.data;
}

export async function createKpiCheckIn(body) {
  const payload = await apiRequest('/api/performance/check-ins', {
    method: 'POST',
    body,
  });
  return payload.data;
}

export async function updateKpiAssignment(assignmentId, body) {
  const payload = await apiRequest(`/api/performance/kpi-assignments/${assignmentId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deleteKpiAssignment(assignmentId) {
  const payload = await apiRequest(`/api/performance/kpi-assignments/${assignmentId}`, {
    method: 'DELETE',
  });
  return payload.data;
}

export async function updateKpiCheckIn(checkInId, body) {
  const payload = await apiRequest(`/api/performance/check-ins/${checkInId}`, {
    method: 'PATCH',
    body,
  });
  return payload.data;
}

export async function deleteKpiCheckIn(checkInId) {
  const payload = await apiRequest(`/api/performance/check-ins/${checkInId}`, {
    method: 'DELETE',
  });
  return payload.data;
}
