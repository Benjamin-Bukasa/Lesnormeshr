import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  EllipsisVertical,
  Eye,
  FileText,
  Flag,
  GraduationCap,
  MessageSquareMore,
  Pencil,
  Search,
  Sparkles,
  ShieldCheck,
  Target,
  Trash2,
  UserCircle2,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import {
  Breadcrumbs,
  Button,
  Card,
  ConfirmModal,
  DataTable,
  DropdownSelect,
  Input,
  Sheet,
  StatusBadge,
  useToast,
} from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import {
  createPerformanceCampaign,
  createPerformanceFeedback,
  createPerformanceReview,
  createPerformanceTraining,
  deletePerformanceCampaign,
  deletePerformanceReview,
  deletePerformanceTraining,
  getPerformanceCampaigns,
  getPerformanceDashboard,
  getPerformanceFeedbacks,
  getPerformanceFilterOptions,
  getPerformanceGoals,
  getPerformancePips,
  getPerformanceReviews,
  getPerformanceRewards,
  getPerformanceTrainings,
  launchCalibrationWorkflow,
  updatePerformanceCampaign,
  updatePerformanceReview,
  updatePerformanceTraining,
} from '../services/performanceApi';
import useAuthStore from '../stores/authStore';

const TABS = [
  { id: 'overview', label: 'Vue d ensemble' },
  { id: 'campaigns', label: 'Campagnes' },
  { id: 'reviews', label: 'Evaluations' },
  { id: 'pips', label: 'PIP' },
  { id: 'rewards', label: 'Recompenses' },
];

const ROLE_VIEWS = [
  { id: 'drh', label: 'Vue DRH', icon: ShieldCheck },
  { id: 'manager', label: 'Vue Manager', icon: UsersRound },
  { id: 'employee', label: 'Vue Collaborateur', icon: UserCircle2 },
];

const BAND_TONE = {
  A: 'success',
  B: 'info',
  C: 'neutral',
  D: 'warning',
  E: 'danger',
};

const PRIORITY_TONE = {
  High: 'danger',
  Medium: 'warning',
  Low: 'info',
};

const EMPTY_FILTER_OPTIONS = {
  cycles: [{ value: 'all', label: 'Toutes les campagnes' }],
  directions: [{ value: 'all', label: 'Toutes les directions' }],
  managers: [{ value: 'all', label: 'Tous les managers' }],
  employees: [],
};

const EMPTY_DASHBOARD = {
  activeCampaign: null,
  highlights: [],
  upcomingActions: [],
  summary: {
    pendingReviewsCount: 0,
    openPipsCount: 0,
    projectedRewards: 0,
    rewardValidationRate: 0,
    distribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    totalDistribution: 0,
  },
};

const CALIBRATION_PRIORITY_OPTIONS = [
  { value: 'High', label: 'Haute' },
  { value: 'Medium', label: 'Moyenne' },
  { value: 'Low', label: 'Basse' },
];

const REVIEW_TYPE_OPTIONS = [
  { value: 'SELF', label: 'Autoevaluation' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'PEER', label: 'Pair' },
  { value: 'DIRECT_REPORT', label: 'N-1 vers N' },
  { value: 'REVIEW_360', label: '360' },
];

const FEEDBACK_TYPE_OPTIONS = [
  { value: 'PRAISE', label: 'Recognition' },
  { value: 'CONSTRUCTIVE', label: 'Constructif' },
  { value: 'COACHING', label: 'Coaching' },
];

const TRAINING_STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planifie' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Termine' },
  { value: 'CANCELLED', label: 'Annule' },
];

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasRequiredValues(values = []) {
  return values.every((value) => String(value ?? '').trim() !== '');
}

function formatCountLabel(count, singular, plural) {
  return count > 1 ? `${count} ${plural}` : `${count} ${singular}`;
}

function buildFullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
}

function resolveRoleView(user) {
  const permissions = user?.access?.permissions || [];
  const roleCode = user?.access?.role?.code || '';

  if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN') {
    return 'drh';
  }

  if (
    permissions.includes('performance.cycle.update')
    || permissions.includes('performance.review.update')
    || permissions.includes('performance.training.update')
  ) {
    return 'manager';
  }

  return 'employee';
}

function hasAccessModule(user, moduleCode) {
  return (user?.access?.modules || []).includes(moduleCode);
}

function hasAccessPermission(user, permissionCode) {
  return (user?.access?.permissions || []).includes(permissionCode);
}

function ScoreBandBadge({ band }) {
  return (
    <StatusBadge
      status={band}
      label={`Note ${band}`}
      tone={BAND_TONE[band] || 'neutral'}
      variant="solid"
      size="sm"
      showDot={false}
      rounded
    />
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  accent,
  Icon,
}) {
  return (
    <Card contentClassName="p-5" className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-text">{value}</p>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

function MetricBar({ label, value, toneClass }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-text">{label}</span>
        <span className="font-semibold text-text">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-background">
        <div
          className={['h-full rounded-full transition-all', toneClass].join(' ')}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function DistributionRow({ band, count, total }) {
  const percent = total ? Math.round((count / total) * 100) : 0;
  const toneClass = {
    A: 'bg-emerald-500',
    B: 'bg-sky-500',
    C: 'bg-slate-500',
    D: 'bg-amber-500',
    E: 'bg-rose-500',
  }[band] || 'bg-slate-500';

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <ScoreBandBadge band={band} />
      <div className="h-2.5 rounded-full bg-background">
        <div className={['h-full rounded-full', toneClass].join(' ')} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm font-medium text-text">{count}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[minmax(0,180px)_1fr] gap-4 border-b border-border/70 py-3 last:border-b-0">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}

function JourneyStepCard({ step, status, description, Icon, accentClass }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className={['inline-flex h-10 w-10 items-center justify-center rounded-2xl', accentClass].join(' ')}>
          <Icon size={18} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text">{step}</p>
            <StatusBadge status={status} label={status} size="sm" />
          </div>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Performances() {
  const toast = useToast();
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeRoleView, setActiveRoleView] = useState(resolveRoleView(currentUser));
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedManager, setSelectedManager] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [campaigns, setCampaigns] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [pips, setPips] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionSheet, setActionSheet] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    code: '',
    name: '',
    periodStart: '',
    periodEnd: '',
    status: 'DRAFT',
    participants: '0',
    description: '',
  });
  const [calibrationForm, setCalibrationForm] = useState({
    campaignId: '',
  });
  const [reviewForm, setReviewForm] = useState({
    cycleId: '',
    revieweeEmployeeId: '',
    reviewerEmployeeId: '',
    reviewType: 'MANAGER',
    status: 'SUBMITTED',
    overallScore: '',
    strengths: '',
    developmentAreas: '',
    comments: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    cycleId: '',
    fromEmployeeId: '',
    toEmployeeId: '',
    feedbackType: 'COACHING',
    title: '',
    message: '',
    rating: '',
    isAnonymous: false,
  });
  const [trainingForm, setTrainingForm] = useState({
    employeeId: '',
    cycleId: '',
    title: '',
    provider: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED',
    hours: '',
    score: '',
    notes: '',
  });

  const hasPerformanceModule = useMemo(
    () => hasAccessModule(currentUser, 'PERFORMANCE_360'),
    [currentUser],
  );

  const accessFlags = useMemo(() => ({
    canReadDashboard: hasAccessPermission(currentUser, 'performance.dashboard.read'),
    canReadOptions: hasAccessPermission(currentUser, 'performance.options.read'),
    canReadCycles: hasAccessPermission(currentUser, 'performance.cycle.read'),
    canCreateCycles: hasAccessPermission(currentUser, 'performance.cycle.create'),
    canUpdateCycles: hasAccessPermission(currentUser, 'performance.cycle.update'),
    canReadGoals: hasAccessPermission(currentUser, 'performance.goal.read'),
    canCreateGoals: hasAccessPermission(currentUser, 'performance.goal.create'),
    canUpdateGoals: hasAccessPermission(currentUser, 'performance.goal.update'),
    canReadReviews: hasAccessPermission(currentUser, 'performance.review.read'),
    canCreateReviews: hasAccessPermission(currentUser, 'performance.review.create'),
    canUpdateReviews: hasAccessPermission(currentUser, 'performance.review.update'),
    canReadFeedbacks: hasAccessPermission(currentUser, 'performance.feedback.read'),
    canCreateFeedbacks: hasAccessPermission(currentUser, 'performance.feedback.create'),
    canReadTrainings: hasAccessPermission(currentUser, 'performance.training.read'),
    canCreateTrainings: hasAccessPermission(currentUser, 'performance.training.create'),
    canUpdateTrainings: hasAccessPermission(currentUser, 'performance.training.update'),
  }), [currentUser]);

  const allowedRoleViews = useMemo(() => {
    if (!hasPerformanceModule) {
      return [];
    }

    const views = new Set();

    if (accessFlags.canReadDashboard && accessFlags.canReadCycles) {
      views.add('drh');
    }

    if (
      accessFlags.canReadReviews
      || accessFlags.canReadGoals
      || accessFlags.canReadTrainings
      || accessFlags.canReadFeedbacks
    ) {
      if (
        accessFlags.canCreateReviews
        || accessFlags.canUpdateReviews
        || accessFlags.canCreateGoals
        || accessFlags.canUpdateGoals
        || accessFlags.canCreateTrainings
        || accessFlags.canUpdateTrainings
        || accessFlags.canCreateFeedbacks
      ) {
        views.add('manager');
      }

      views.add('employee');
    }

    return ROLE_VIEWS.filter((view) => views.has(view.id));
  }, [accessFlags, hasPerformanceModule]);

  const hasPerformanceAccess = allowedRoleViews.length > 0;
  const performanceAccessProfile = useMemo(() => ({
    canReadDashboard: accessFlags.canReadDashboard,
    canReadCycles: accessFlags.canReadCycles,
    canReadReviews: accessFlags.canReadReviews,
    canReadGoals: accessFlags.canReadGoals,
    canReadTrainings: accessFlags.canReadTrainings,
    canReadFeedbacks: accessFlags.canReadFeedbacks,
  }), [accessFlags]);

  const activeFilters = useMemo(
    () => ({
      cycle: selectedCycle,
      direction: selectedDirection,
      manager: selectedManager,
      search,
    }),
    [search, selectedCycle, selectedDirection, selectedManager],
  );

  useEffect(() => {
    const preferredView = resolveRoleView(currentUser);
    const allowedIds = allowedRoleViews.map((item) => item.id);

    if (!allowedIds.length) {
      setActiveRoleView('employee');
      return;
    }

    if (allowedIds.includes(preferredView)) {
      setActiveRoleView(preferredView);
      return;
    }

    setActiveRoleView(allowedIds[0]);
  }, [allowedRoleViews, currentUser]);

  useEffect(() => {
    let cancelled = false;

    if (!hasPerformanceAccess || !accessFlags.canReadOptions) {
      setFilterOptions(EMPTY_FILTER_OPTIONS);
      return () => {
        cancelled = true;
      };
    }

    getPerformanceFilterOptions()
      .then((payload) => {
        if (!cancelled) {
          setFilterOptions(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Impossible de charger les filtres performance.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessFlags.canReadOptions, hasPerformanceAccess, toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!hasPerformanceAccess) {
        setDashboard(EMPTY_DASHBOARD);
        setCampaigns([]);
        setGoals([]);
        setReviews([]);
        setFeedbacks([]);
        setPips([]);
        setRewards([]);
        setTrainings([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const [
          dashboardPayload,
          campaignsPayload,
          goalsPayload,
          reviewsPayload,
          feedbacksPayload,
          pipsPayload,
          rewardsPayload,
          trainingsPayload,
        ] = await Promise.all([
          getPerformanceDashboard(activeFilters, performanceAccessProfile),
          getPerformanceCampaigns(activeFilters, performanceAccessProfile),
          getPerformanceGoals(activeFilters, performanceAccessProfile),
          getPerformanceReviews(activeFilters, performanceAccessProfile),
          getPerformanceFeedbacks(activeFilters, performanceAccessProfile),
          getPerformancePips(activeFilters, performanceAccessProfile),
          getPerformanceRewards(activeFilters, performanceAccessProfile),
          getPerformanceTrainings(activeFilters, performanceAccessProfile),
        ]);

        if (cancelled) {
          return;
        }

        setDashboard(dashboardPayload);
        setCampaigns(campaignsPayload);
        setGoals(goalsPayload);
        setReviews(reviewsPayload);
        setFeedbacks(feedbacksPayload);
        setPips(pipsPayload);
        setRewards(rewardsPayload);
        setTrainings(trainingsPayload);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger les donnees de performance.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [activeFilters, hasPerformanceAccess, performanceAccessProfile, reloadKey, toast]);

  const campaignOptions = useMemo(
    () => campaigns.map((item) => ({
      value: item.id,
      label: `${item.code} - ${item.name}`,
    })),
    [campaigns],
  );

  const employeeOptions = useMemo(
    () => (filterOptions.employees || []).map((item) => ({
      value: item.value,
      label: item.label,
    })),
    [filterOptions.employees],
  );

  const currentUserLabel = useMemo(() => buildFullName(currentUser), [currentUser]);

  const inferredManagerLabel = useMemo(() => {
    const matchedManager = filterOptions.managers.find(
      (item) => normalize(item.label) === normalize(currentUserLabel),
    );

    if (matchedManager?.label) {
      return matchedManager.label;
    }

    return reviews[0]?.manager || campaigns[0]?.owner || 'Manager';
  }, [campaigns, currentUserLabel, filterOptions.managers, reviews]);

  const inferredEmployeeLabel = useMemo(() => {
    const matchedEmployee = (filterOptions.employees || []).find(
      (item) => normalize(item.label) === normalize(currentUserLabel),
    );

    if (matchedEmployee?.label) {
      return matchedEmployee.label;
    }

    return reviews[0]?.employee || goals[0]?.employee || currentUserLabel || 'Collaborateur';
  }, [currentUserLabel, filterOptions.employees, goals, reviews]);

  const managerViewData = useMemo(() => {
    const managerName = inferredManagerLabel;
    const managerReviews = reviews.filter((item) => normalize(item.manager) === normalize(managerName));
    const managerGoals = goals.filter((item) => normalize(item.manager) === normalize(managerName));
    const managerFeedbacks = feedbacks.filter(
      (item) => normalize(item.author) === normalize(managerName) || normalize(item.manager) === normalize(managerName),
    );
    const managerPips = pips.filter((item) => normalize(item.manager) === normalize(managerName));
    const managerTrainings = trainings.filter((item) => normalize(item.manager) === normalize(managerName));
    const teamMembers = Array.from(
      new Set([...managerReviews.map((item) => item.employee), ...managerGoals.map((item) => item.employee)].filter(Boolean)),
    );

    return {
      managerName,
      reviews: managerReviews,
      goals: managerGoals,
      feedbacks: managerFeedbacks,
      pips: managerPips,
      trainings: managerTrainings,
      teamMembers,
      pendingReviews: managerReviews.filter((item) => normalize(item.status) !== 'completed'),
      completedGoals: managerGoals.filter((item) => normalize(item.status) === 'completed'),
      activeCampaign: campaigns.find((item) => normalize(item.status) === 'active') || campaigns[0] || null,
    };
  }, [campaigns, feedbacks, goals, inferredManagerLabel, pips, reviews, trainings]);

  const employeeViewData = useMemo(() => {
    const employeeName = inferredEmployeeLabel;
    const employeeReviews = reviews.filter((item) => normalize(item.employee) === normalize(employeeName));
    const employeeGoals = goals.filter((item) => normalize(item.employee) === normalize(employeeName));
    const employeeFeedbacks = feedbacks.filter((item) => normalize(item.receiver) === normalize(employeeName));
    const employeeTrainings = trainings.filter((item) => normalize(item.employee) === normalize(employeeName));
    const employeeRewards = rewards.filter((item) => normalize(item.employee) === normalize(employeeName));
    const employeePip = pips.find((item) => normalize(item.employee) === normalize(employeeName)) || null;
    const activeCampaign = campaigns.find((item) => normalize(item.status) === 'active') || campaigns[0] || null;

    return {
      employeeName,
      reviews: employeeReviews,
      goals: employeeGoals,
      feedbacks: employeeFeedbacks,
      trainings: employeeTrainings,
      rewards: employeeRewards,
      pip: employeePip,
      activeCampaign,
    };
  }, [campaigns, feedbacks, goals, inferredEmployeeLabel, pips, rewards, reviews, trainings]);

  const resetActionSheet = () => {
    setActionSheet(null);
    setIsSubmittingAction(false);
  };

  const closeDeleteModal = () => setDeleteTarget(null);

  const handleBulkDelete = async (rows, kind) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    if (safeRows.length === 0) {
      return;
    }

    try {
      const tasks = safeRows.map((row) => {
        if (kind === 'campaign') {
          return deletePerformanceCampaign(row.id);
        }
        if (kind === 'review') {
          return deletePerformanceReview(row.id);
        }
        if (kind === 'training') {
          return deletePerformanceTraining(row.id);
        }
        return Promise.resolve();
      });

      await Promise.all(tasks);

      const successLabel = kind === 'campaign'
        ? formatCountLabel(safeRows.length, 'campagne supprimee', 'campagnes supprimees')
        : kind === 'review'
          ? formatCountLabel(safeRows.length, 'evaluation supprimee', 'evaluations supprimees')
          : formatCountLabel(safeRows.length, 'plan supprime', 'plans supprimes');

      toast.success(`${successLabel}.`);
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer la selection.');
    }
  };

  const openCreateCampaignSheet = () => {
    setCampaignForm({
      code: '',
      name: '',
      periodStart: '',
      periodEnd: '',
      status: 'DRAFT',
      participants: '0',
      description: '',
    });
    setActionSheet('createCampaign');
  };

  const openCalibrationSheet = () => {
    const fallbackCampaign = campaigns[0] || dashboard.activeCampaign || null;
    setCalibrationForm({
      campaignId: fallbackCampaign?.id || '',
    });
    setActionSheet('launchCalibration');
  };

  const openEditCampaignSheet = (campaign) => {
    setCampaignForm({
      code: campaign.code || '',
      name: campaign.name || '',
      periodStart: campaign.periodStart ? String(campaign.periodStart).slice(0, 10) : '',
      periodEnd: campaign.periodEnd ? String(campaign.periodEnd).slice(0, 10) : '',
      status: campaign.status || 'DRAFT',
      participants: String(campaign.participants || 0),
      description: campaign.description === 'Campagne de performance.' ? '' : campaign.description || '',
    });
    setActionSheet({ type: 'editCampaign', record: campaign });
  };

  const openCreateReviewSheet = () => {
    const defaultEmployee = filterOptions.employees[0]?.value || '';
    const defaultManager = filterOptions.employees[1]?.value || filterOptions.employees[0]?.value || '';
    setReviewForm({
      cycleId: selectedCycle !== 'all' ? selectedCycle : filterOptions.cycles[1]?.value || '',
      revieweeEmployeeId: defaultEmployee,
      reviewerEmployeeId: defaultManager,
      reviewType: 'MANAGER',
      status: 'SUBMITTED',
      overallScore: '',
      strengths: '',
      developmentAreas: '',
      comments: '',
    });
    setActionSheet('createReview');
  };

  const openEditReviewSheet = (review) => {
    setReviewForm({
      cycleId: review.cycle || '',
      revieweeEmployeeId: review.employeeId || review.raw?.reviewee?.id || '',
      reviewerEmployeeId: review.raw?.reviewer?.id || '',
      reviewType: review.reviewType || 'MANAGER',
      status: review.status || 'SUBMITTED',
      overallScore: review.score ? String(review.score) : '',
      strengths: (review.strengths || []).join(', '),
      developmentAreas: (review.developmentAreas || []).join(', '),
      comments: review.summary === 'Evaluation en cours de traitement.' ? '' : review.summary || '',
    });
    setActionSheet({ type: 'editReview', record: review });
  };

  const openCreateFeedbackSheet = () => {
    const defaultEmployee = filterOptions.employees[0]?.value || '';
    setFeedbackForm({
      cycleId: selectedCycle !== 'all' ? selectedCycle : filterOptions.cycles[1]?.value || '',
      fromEmployeeId: defaultEmployee,
      toEmployeeId: filterOptions.employees[1]?.value || defaultEmployee,
      feedbackType: 'COACHING',
      title: '',
      message: '',
      rating: '',
      isAnonymous: false,
    });
    setActionSheet('createFeedback');
  };

  const openSelfReviewSheet = () => {
    const matchedEmployee = (filterOptions.employees || []).find(
      (item) => normalize(item.label) === normalize(inferredEmployeeLabel),
    );

    setReviewForm({
      cycleId: selectedCycle !== 'all' ? selectedCycle : filterOptions.cycles[1]?.value || '',
      revieweeEmployeeId: matchedEmployee?.value || '',
      reviewerEmployeeId: matchedEmployee?.value || '',
      reviewType: 'SELF',
      status: 'SUBMITTED',
      overallScore: '',
      strengths: '',
      developmentAreas: '',
      comments: '',
    });
    setActionSheet('createReview');
  };

  const openCreateTrainingSheet = () => {
    const defaultEmployee = filterOptions.employees[0]?.value || '';
    setTrainingForm({
      employeeId: defaultEmployee,
      cycleId: selectedCycle !== 'all' ? selectedCycle : filterOptions.cycles[1]?.value || '',
      title: '',
      provider: '',
      startDate: '',
      endDate: '',
      status: 'PLANNED',
      hours: '',
      score: '',
      notes: '',
    });
    setActionSheet('createTraining');
  };

  const openEditTrainingSheet = (training) => {
    setTrainingForm({
      employeeId: training.employeeId || '',
      cycleId: training.cycle || '',
      title: training.title || '',
      provider: training.provider || '',
      startDate: training.startDate ? String(training.startDate).slice(0, 10) : '',
      endDate: training.endDate ? String(training.endDate).slice(0, 10) : '',
      status: training.status || 'PLANNED',
      hours: training.hours ? String(training.hours) : '',
      score: training.score ? String(training.score) : '',
      notes: training.notes || '',
    });
    setActionSheet({ type: 'editTraining', record: training });
  };

  const openPipActionSheet = (pip) => {
    if (pip.primaryTrainingId) {
      const matchedTraining = trainings.find((item) => item.id === pip.primaryTrainingId);
      if (matchedTraining) {
        openEditTrainingSheet(matchedTraining);
        return;
      }
    }

    setTrainingForm({
      employeeId: pip.employeeId || '',
      cycleId: pip.cycle || '',
      title: `Plan de developpement - ${pip.employee}`,
      provider: '',
      startDate: '',
      endDate: '',
      status: 'PLANNED',
      hours: '',
      score: '',
      notes: pip.focus || '',
    });
    setActionSheet('createTraining');
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([campaignForm.code, campaignForm.name, campaignForm.periodStart, campaignForm.periodEnd])) {
      toast.error('Renseigne le code, le nom et les dates de la campagne.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createPerformanceCampaign({
        code: campaignForm.code,
        name: campaignForm.name,
        periodStart: campaignForm.periodStart,
        periodEnd: campaignForm.periodEnd,
        status: campaignForm.status,
        description: campaignForm.description
          ? `${campaignForm.description}\nPopulation estimee : ${campaignForm.participants || 0}`
          : `Population estimee : ${campaignForm.participants || 0}`,
      });
      toast.success(`Campagne creee : ${campaignForm.code} - ${campaignForm.name}.`);
      setActiveTab('campaigns');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer la campagne.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleLaunchCalibration = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([calibrationForm.campaignId])) {
      toast.error('Choisis une campagne avant de lancer la calibration.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await launchCalibrationWorkflow(calibrationForm);
      toast.success('Calibration lancee pour la campagne selectionnee.');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de lancer la calibration.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateCampaign = async (event) => {
    event.preventDefault();

    const campaignId = actionSheet?.record?.id;
    if (!campaignId) {
      toast.error('Campagne introuvable pour la mise a jour.');
      return;
    }

    if (!hasRequiredValues([campaignForm.code, campaignForm.name, campaignForm.periodStart, campaignForm.periodEnd])) {
      toast.error('Renseigne le code, le nom et les dates de la campagne.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await updatePerformanceCampaign(campaignId, {
        code: campaignForm.code,
        name: campaignForm.name,
        periodStart: campaignForm.periodStart,
        periodEnd: campaignForm.periodEnd,
        status: campaignForm.status,
        description: campaignForm.description
          ? `${campaignForm.description}\nPopulation estimee : ${campaignForm.participants || 0}`
          : `Population estimee : ${campaignForm.participants || 0}`,
      });
      toast.success(`Campagne mise a jour : ${campaignForm.code} - ${campaignForm.name}.`);
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour la campagne.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([
      reviewForm.cycleId,
      reviewForm.revieweeEmployeeId,
      reviewForm.reviewerEmployeeId,
      reviewForm.reviewType,
    ])) {
      toast.error('Complete la campagne, le collaborateur, l evaluateur et le type.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createPerformanceReview(reviewForm);
      toast.success('Evaluation creee et ajoutee a la file de revues.');
      setActiveTab('reviews');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer l evaluation.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateReview = async (event) => {
    event.preventDefault();

    const reviewId = actionSheet?.record?.id;
    if (!reviewId) {
      toast.error('Evaluation introuvable pour la mise a jour.');
      return;
    }

    if (!hasRequiredValues([
      reviewForm.cycleId,
      reviewForm.revieweeEmployeeId,
      reviewForm.reviewerEmployeeId,
      reviewForm.reviewType,
    ])) {
      toast.error('Complete la campagne, le collaborateur, l evaluateur et le type.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await updatePerformanceReview(reviewId, reviewForm);
      toast.success('Evaluation mise a jour.');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour l evaluation.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCreateFeedback = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([
      feedbackForm.cycleId,
      feedbackForm.toEmployeeId,
      feedbackForm.feedbackType,
      feedbackForm.message,
    ])) {
      toast.error('Complete la campagne, le destinataire, le type et le message.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createPerformanceFeedback({
        ...feedbackForm,
        rating: feedbackForm.rating === '' ? undefined : feedbackForm.rating,
      });
      toast.success('Feedback ajoute au cycle de performance.');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer le feedback.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCreateTraining = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([trainingForm.employeeId, trainingForm.title])) {
      toast.error('Choisis un collaborateur et renseigne le titre du plan.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createPerformanceTraining({
        ...trainingForm,
        hours: trainingForm.hours === '' ? undefined : trainingForm.hours,
        score: trainingForm.score === '' ? undefined : trainingForm.score,
      });
      toast.success(`Plan de developpement cree : ${trainingForm.title}.`);
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer le plan de developpement.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateTraining = async (event) => {
    event.preventDefault();

    const trainingId = actionSheet?.record?.id;
    if (!trainingId) {
      toast.error('Plan de developpement introuvable pour la mise a jour.');
      return;
    }

    if (!hasRequiredValues([trainingForm.employeeId, trainingForm.title])) {
      toast.error('Choisis un collaborateur et renseigne le titre du plan.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await updatePerformanceTraining(trainingId, {
        ...trainingForm,
        hours: trainingForm.hours === '' ? undefined : trainingForm.hours,
        score: trainingForm.score === '' ? undefined : trainingForm.score,
      });
      toast.success(`Plan de developpement mis a jour : ${trainingForm.title}.`);
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour le plan.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.record?.id) {
      closeDeleteModal();
      return;
    }

    try {
      setIsSubmittingAction(true);

      if (deleteTarget.kind === 'campaign') {
        await deletePerformanceCampaign(deleteTarget.record.id);
      } else if (deleteTarget.kind === 'review') {
        await deletePerformanceReview(deleteTarget.record.id);
      } else if (deleteTarget.kind === 'training') {
        await deletePerformanceTraining(deleteTarget.record.id);
      }

      toast.success(
        deleteTarget.kind === 'campaign'
          ? `Campagne supprimee : ${deleteTarget.record.code}.`
          : deleteTarget.kind === 'review'
            ? `Evaluation supprimee : ${deleteTarget.record.employee}.`
            : `Plan de developpement supprime : ${deleteTarget.record.title}.`,
      );
      setReloadKey((value) => value + 1);
      closeDeleteModal();
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer cet element.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const performanceRowActions = (row, kind) => {
    const items = [
      {
        id: `${kind}-view-${row.id}`,
        label: 'Voir le detail',
        icon: Eye,
        onClick: () => setSelectedDetail({ kind, record: row }),
      },
    ];

    if (kind === 'campaign') {
      if (accessFlags.canUpdateCycles) {
        items.push(
          {
            id: `${kind}-edit-${row.id}`,
            label: 'Modifier',
            icon: Pencil,
            onClick: () => openEditCampaignSheet(row),
          },
          {
            id: `${kind}-delete-${row.id}`,
            label: 'Supprimer',
            icon: Trash2,
            variant: 'danger',
            onClick: () => setDeleteTarget({ kind, record: row }),
          },
        );
      }
    }

    if (kind === 'review') {
      if (accessFlags.canUpdateReviews) {
        items.push(
          {
            id: `${kind}-edit-${row.id}`,
            label: 'Modifier',
            icon: Pencil,
            onClick: () => openEditReviewSheet(row),
          },
          {
            id: `${kind}-delete-${row.id}`,
            label: 'Supprimer',
            icon: Trash2,
            variant: 'danger',
            onClick: () => setDeleteTarget({ kind, record: row }),
          },
        );
      }
    }

    if (kind === 'pip') {
      items.push(
        {
          id: `${kind}-edit-${row.id}`,
          label: row.primaryTrainingId ? 'Modifier le plan' : 'Creer le plan',
          icon: Pencil,
          disabled: !(row.primaryTrainingId ? accessFlags.canUpdateTrainings : accessFlags.canCreateTrainings),
          onClick: () => openPipActionSheet(row),
        },
        {
          id: `${kind}-delete-${row.id}`,
          label: 'Supprimer le plan',
          icon: Trash2,
          variant: 'danger',
          disabled: !row.primaryTrainingId || !accessFlags.canUpdateTrainings,
          onClick: () => {
            const matchedTraining = trainings.find((item) => item.id === row.primaryTrainingId);
            if (matchedTraining) {
              setDeleteTarget({ kind: 'training', record: matchedTraining });
            }
          },
        },
      );
    }

    return (
      <DropdownAction
        label={<EllipsisVertical size={18} strokeWidth={1.5} />}
        buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
        items={items}
      />
    );
  };

  const campaignColumns = [
    { header: 'Code', accessor: 'code' },
    {
      header: 'Campagne',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-text">{row.name}</p>
          <p className="text-xs text-muted">{row.description}</p>
        </div>
      ),
    },
    { header: 'Phase', accessor: 'phase' },
    {
      header: 'Participants',
      render: (row) => `${row.participants} collaborateurs`,
    },
    {
      header: 'Progression',
      render: (row) => (
        <div className="min-w-[140px] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Calibration</span>
            <span>{row.calibrationCompletion}%</span>
          </div>
          <div className="h-2 rounded-full bg-background">
            <div className="h-full rounded-full bg-primary" style={{ width: `${row.calibrationCompletion}%` }} />
          </div>
        </div>
      ),
    },
    { header: 'Echeance', accessor: 'deadline' },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const reviewColumns = [
    { header: 'Collaborateur', accessor: 'employee' },
    { header: 'Direction', accessor: 'direction' },
    { header: 'Manager', accessor: 'manager' },
    { header: 'Type', accessor: 'reviewType' },
    {
      header: 'Score',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text">{row.score}/100</span>
          <ScoreBandBadge band={row.band} />
        </div>
      ),
    },
    { header: 'Action attendue', accessor: 'nextAction' },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const pipColumns = [
    { header: 'Collaborateur', accessor: 'employee' },
    { header: 'Manager', accessor: 'manager' },
    {
      header: 'Note initiale',
      render: (row) => <ScoreBandBadge band={row.initialBand} />,
    },
    { header: 'Duree', accessor: 'durationLabel' },
    {
      header: 'Progression',
      render: (row) => (
        <div className="min-w-[140px] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Plan</span>
            <span>{row.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-background">
            <div
              className={['h-full rounded-full', normalize(row.status) === 'at risk' ? 'bg-rose-500' : 'bg-amber-500'].join(' ')}
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    { header: 'Prochaine revue', accessor: 'nextReview' },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const rewardColumns = [
    { header: 'Collaborateur', accessor: 'employee' },
    {
      header: 'Resultat',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">{row.score}/100</span>
            <ScoreBandBadge band={row.band} />
          </div>
          <p className="text-xs text-muted">{row.gratificationPercent}% de gratification</p>
        </div>
      ),
    },
    {
      header: 'Gratification',
      render: (row) => formatCurrency(row.gratificationAmount),
    },
    {
      header: 'Bonus',
      render: (row) => formatCurrency(row.bonusAmount),
    },
    {
      header: 'Prime merite',
      render: (row) => formatCurrency(row.meritPrimeAmount),
    },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const goalJourneyColumns = [
    { header: 'Objectif', accessor: 'title' },
    { header: 'Cible', accessor: 'targetValue' },
    {
      header: 'Avancement',
      render: (row) => `${row.progressPercent}%`,
    },
    {
      header: 'Echeance',
      accessor: 'dueDate',
    },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const feedbackColumns = [
    { header: 'Titre', accessor: 'title' },
    { header: 'Auteur', accessor: 'author' },
    { header: 'Destinataire', accessor: 'receiver' },
    { header: 'Type', accessor: 'feedbackType' },
    {
      header: 'Note',
      render: (row) => row.rating ?? '-',
    },
  ];

  const trainingColumns = [
    { header: 'Plan', accessor: 'title' },
    { header: 'Collaborateur', accessor: 'employee' },
    { header: 'Provider', accessor: 'provider' },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
    {
      header: 'Score',
      render: (row) => (row.score ? `${row.score}/100` : '-'),
    },
  ];

  const renderOverview = () => (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Campagne active"
          value={dashboard.activeCampaign ? dashboard.activeCampaign.code : 'N/A'}
          subtitle={dashboard.activeCampaign ? `${dashboard.activeCampaign.participants} participants` : 'Aucune campagne active'}
          accent="bg-primary/10 text-primary"
          Icon={CalendarClock}
        />
        <SummaryCard
          title="Evaluations a traiter"
          value={dashboard.summary.pendingReviewsCount}
          subtitle="Revues en attente de validation ou calibration"
          accent="bg-sky-500/10 text-sky-600"
          Icon={ClipboardCheck}
        />
        <SummaryCard
          title="Plans d amelioration"
          value={dashboard.summary.openPipsCount}
          subtitle="Collaborateurs en suivi renforce"
          accent="bg-amber-500/10 text-amber-600"
          Icon={CircleAlert}
        />
        <SummaryCard
          title="Budget recompenses"
          value={formatCurrency(dashboard.summary.projectedRewards)}
          subtitle="Projection gratification, bonus et merite"
          accent="bg-emerald-500/10 text-emerald-600"
          Icon={Wallet}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card
          title="Progression de campagne"
          subtitle={dashboard.activeCampaign ? dashboard.activeCampaign.name : 'Aucune campagne active'}
        >
          {dashboard.activeCampaign ? (
            <div className="space-y-5">
              <MetricBar label="Autoevaluations" value={dashboard.activeCampaign.selfCompletion} toneClass="bg-sky-500" />
              <MetricBar label="Revue manager" value={dashboard.activeCampaign.managerCompletion} toneClass="bg-primary" />
              <MetricBar label="Calibration" value={dashboard.activeCampaign.calibrationCompletion} toneClass="bg-amber-500" />
              <MetricBar label="Finalisation" value={dashboard.activeCampaign.finalizationCompletion} toneClass="bg-emerald-500" />
            </div>
          ) : (
            <p className="text-sm text-muted">Aucune campagne disponible avec les filtres actuels.</p>
          )}
        </Card>

        <Card
          title="Repartition des notes"
          subtitle="Consolidee a partir des resultats filtres"
        >
          <div className="space-y-4">
            {Object.entries(dashboard.summary.distribution).map(([band, count]) => (
              <DistributionRow key={band} band={band} count={count} total={dashboard.summary.totalDistribution} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <Card
          title="Top performeurs"
          subtitle="Profils mis en avant sur la campagne visible"
        >
          <div className="space-y-4">
            {dashboard.highlights.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDetail({ kind: 'highlight', record: item })}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text">{item.employee}</p>
                    <ScoreBandBadge band={item.band} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.role}</p>
                  <p className="mt-2 text-sm text-text">{item.insight}</p>
                </div>
                <span className="text-sm font-semibold text-primary">{item.score}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card
          title="Actions prioritaires"
          subtitle="Ce que la DRH doit debloquer ensuite"
        >
          <div className="space-y-3">
            {dashboard.upcomingActions.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-text">{item.title}</p>
                  <StatusBadge
                    status={item.priority}
                    label={item.priority}
                    tone={PRIORITY_TONE[item.priority] || 'neutral'}
                    size="sm"
                  />
                </div>
                <p className="mt-2 text-sm text-muted">{item.owner}</p>
                <p className="mt-1 text-xs text-muted">Echeance : {item.dueDate}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Signal RH"
          subtitle="Lecture rapide du risque et de la recompense"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">Taux de validation reward</p>
                  <p className="mt-1 text-xs text-muted">Part des decisions deja validees</p>
                </div>
                <span className="text-2xl font-semibold text-text">{dashboard.summary.rewardValidationRate}%</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">Notes D + E</p>
                  <p className="mt-1 text-xs text-muted">Population a surveiller immediatement</p>
                </div>
                <span className="text-2xl font-semibold text-text">{dashboard.summary.distribution.D + dashboard.summary.distribution.E}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">Population A + B</p>
                  <p className="mt-1 text-xs text-muted">Base prioritaire pour bonus et promotion</p>
                </div>
                <span className="text-2xl font-semibold text-text">{dashboard.summary.distribution.A + dashboard.summary.distribution.B}</span>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );

  const renderDrhJourney = () => {
    const activeCampaign = dashboard.activeCampaign;

    return (
      <div className="space-y-4">
        <Card
          title="Parcours DRH de la campagne"
          subtitle={activeCampaign ? `${activeCampaign.code} - ${activeCampaign.name}` : 'Aucune campagne active'}
        >
          <div className="grid gap-4 xl:grid-cols-4">
            <JourneyStepCard
              step="1. Cadrer la campagne"
              status={campaigns.length ? 'Pret' : 'A lancer'}
              description="Definir le cycle, la population, les dates et les regles de diffusion."
              Icon={Flag}
              accentClass="bg-primary/10 text-primary"
            />
            <JourneyStepCard
              step="2. Orchestrer les evaluations"
              status={dashboard.summary.pendingReviewsCount ? 'En cours' : 'Termine'}
              description="Suivre les autoevaluations, les revues manager et les points de blocage."
              Icon={ClipboardCheck}
              accentClass="bg-sky-500/10 text-sky-600"
            />
            <JourneyStepCard
              step="3. Calibrer les decisions"
              status={activeCampaign?.calibrationCompletion ? 'En cours' : 'A planifier'}
              description="Arbitrer les notes, valider la distribution et securiser les dossiers sensibles."
              Icon={UsersRound}
              accentClass="bg-amber-500/10 text-amber-600"
            />
            <JourneyStepCard
              step="4. Declencher les suites RH"
              status={dashboard.summary.openPipsCount ? 'Sous suivi' : 'Pret'}
              description="Activer les PIP, les formations, les primes et les signaux de promotion."
              Icon={Award}
              accentClass="bg-emerald-500/10 text-emerald-600"
            />
          </div>
        </Card>

        <Card
          title="Pilotage transverse"
          subtitle="Le cockpit complet DRH reste disponible ci-dessous."
        >
          <p className="text-sm leading-6 text-muted">
            Cette vue centralise la creation des campagnes, la supervision des evaluations, la calibration,
            les plans d amelioration et la projection des recompenses. Les onglets suivants servent de centre
            de pilotage RH pour tout le cycle.
          </p>
        </Card>
      </div>
    );
  };

  const renderManagerJourney = () => {
    const { activeCampaign, completedGoals, feedbacks: teamFeedbacks, goals: teamGoals, managerName, pendingReviews, pips: teamPips, reviews: teamReviews, teamMembers, trainings: teamTrainings } = managerViewData;

    return (
      <div className="space-y-4">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Mon equipe"
            value={teamMembers.length}
            subtitle="Collaborateurs suivis dans la campagne"
            accent="bg-primary/10 text-primary"
            Icon={UsersRound}
          />
          <SummaryCard
            title="Revues a rendre"
            value={pendingReviews.length}
            subtitle="Evaluations manager encore ouvertes"
            accent="bg-sky-500/10 text-sky-600"
            Icon={ClipboardCheck}
          />
          <SummaryCard
            title="Objectifs valides"
            value={completedGoals.length}
            subtitle="Objectifs equipes deja boucles"
            accent="bg-emerald-500/10 text-emerald-600"
            Icon={Target}
          />
          <SummaryCard
            title="PIP d equipe"
            value={teamPips.length}
            subtitle="Collaborateurs a suivre de pres"
            accent="bg-amber-500/10 text-amber-600"
            Icon={CircleAlert}
          />
        </section>

        <Card
          title={`Parcours manager - ${managerName}`}
          subtitle={activeCampaign ? `Campagne visible : ${activeCampaign.code}` : 'Aucune campagne active'}
        >
          <div className="grid gap-4 xl:grid-cols-4">
            <JourneyStepCard
              step="1. Valider les objectifs"
              status={teamGoals.length ? 'En cours' : 'A lancer'}
              description="Cadrer les objectifs SMART et les attentes de resultat pour chaque collaborateur."
              Icon={Target}
              accentClass="bg-primary/10 text-primary"
            />
            <JourneyStepCard
              step="2. Finaliser les revues"
              status={pendingReviews.length ? 'Action requise' : 'Termine'}
              description="Completer les revues manager, les commentaires et les scores avant calibration."
              Icon={FileText}
              accentClass="bg-sky-500/10 text-sky-600"
            />
            <JourneyStepCard
              step="3. Donner du feedback"
              status={teamFeedbacks.length ? 'Actif' : 'A renforcer'}
              description="Faire vivre les feedbacks continus, les appreciations et les points de coaching."
              Icon={MessageSquareMore}
              accentClass="bg-violet-500/10 text-violet-600"
            />
            <JourneyStepCard
              step="4. Suivre les plans"
              status={teamTrainings.length || teamPips.length ? 'Sous suivi' : 'A structurer'}
              description="Accompagner les PIP, la formation et la remediation apres revue."
              Icon={GraduationCap}
              accentClass="bg-amber-500/10 text-amber-600"
            />
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <DataTable
            title="Evaluations de mon equipe"
            description="Les revues manager et les dossiers qui attendent une action."
            columns={reviewColumns}
            data={teamReviews}
            emptyMessage="Aucune evaluation d equipe"
            renderActions={(row) => performanceRowActions(row, 'review')}
          />

          <div className="space-y-4">
            <Card title="Mes prochaines actions" subtitle="Ce que le manager doit traiter en priorite">
              <div className="space-y-3">
                {pendingReviews.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text">{item.employee}</p>
                        <p className="text-xs text-muted">{item.nextAction}</p>
                      </div>
                      <StatusBadge status={item.status} label={item.status} size="sm" />
                    </div>
                  </div>
                ))}
                {!pendingReviews.length ? (
                  <p className="text-sm text-muted">Aucune revue manager en attente.</p>
                ) : null}
              </div>
            </Card>

            <Card title="PIP et accompagnement" subtitle="Collaborateurs a soutenir apres revue">
              <div className="space-y-3">
                {teamPips.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text">{item.employee}</p>
                        <p className="text-xs text-muted">{item.focus}</p>
                      </div>
                      <ScoreBandBadge band={item.initialBand} />
                    </div>
                  </div>
                ))}
                {!teamPips.length ? (
                  <p className="text-sm text-muted">Aucun PIP actif pour cette equipe.</p>
                ) : null}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DataTable
            title="Objectifs de mon equipe"
            description="Les objectifs SMART a suivre avant la calibration."
            columns={goalJourneyColumns}
            data={teamGoals}
            emptyMessage="Aucun objectif d equipe"
            renderActions={(row) => (
              <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: 'goal', record: row })}>
                Voir
              </Button>
            )}
          />

          <DataTable
            title="Feedback et coaching"
            description="Les retours emis pour accompagner les collaborateurs."
            columns={feedbackColumns}
            data={teamFeedbacks}
            emptyMessage="Aucun feedback d equipe"
            renderActions={(row) => (
              <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: 'feedback', record: row })}>
                Ouvrir
              </Button>
            )}
          />
        </div>

        <DataTable
          title="Plans de developpement de mon equipe"
          description="Formations, coaching et remediations en cours sur l equipe."
          columns={trainingColumns}
          data={teamTrainings}
          emptyMessage="Aucun plan de developpement d equipe"
          renderActions={(row) => (
            <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: 'training', record: row })}>
              Suivre
            </Button>
          )}
        />
      </div>
    );
  };

  const renderEmployeeJourney = () => {
    const { activeCampaign, employeeName, feedbacks: myFeedbacks, goals: myGoals, pip: myPip, rewards: myRewards, reviews: myReviews, trainings: myTrainings } = employeeViewData;
    const latestReview = myReviews[0] || null;
    const latestReward = myRewards[0] || null;

    return (
      <div className="space-y-4">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Ma campagne"
            value={activeCampaign?.code || 'N/A'}
            subtitle={activeCampaign ? activeCampaign.phase : 'Aucune campagne visible'}
            accent="bg-primary/10 text-primary"
            Icon={BriefcaseBusiness}
          />
          <SummaryCard
            title="Mes objectifs"
            value={myGoals.length}
            subtitle="Objectifs personnels suivis"
            accent="bg-sky-500/10 text-sky-600"
            Icon={Target}
          />
          <SummaryCard
            title="Ma note"
            value={latestReview ? `${latestReview.score}/100` : 'N/A'}
            subtitle={latestReview ? `Bande ${latestReview.band}` : 'Aucune evaluation finalisee'}
            accent="bg-emerald-500/10 text-emerald-600"
            Icon={Award}
          />
          <SummaryCard
            title="Developpement"
            value={myTrainings.length}
            subtitle={myPip ? 'PIP ou accompagnement actif' : 'Plans de progression'}
            accent="bg-amber-500/10 text-amber-600"
            Icon={GraduationCap}
          />
        </section>

        <Card
          title={`Mon parcours de campagne - ${employeeName}`}
          subtitle={activeCampaign ? `${activeCampaign.name}` : 'Aucune campagne active'}
        >
          <div className="grid gap-4 xl:grid-cols-4">
            <JourneyStepCard
              step="1. Comprendre mes objectifs"
              status={myGoals.length ? 'Visible' : 'En attente'}
              description="Lire les attentes, le poids de chaque objectif et les resultats a produire."
              Icon={Target}
              accentClass="bg-primary/10 text-primary"
            />
            <JourneyStepCard
              step="2. Faire mon autoevaluation"
              status={myReviews.some((item) => normalize(item.reviewType) === 'self') ? 'Soumise' : 'A faire'}
              description="Renseigner mes forces, mes progres et ma perception de la performance."
              Icon={FileText}
              accentClass="bg-sky-500/10 text-sky-600"
            />
            <JourneyStepCard
              step="3. Recevoir les feedbacks"
              status={myFeedbacks.length ? 'Disponible' : 'En attente'}
              description="Consulter les feedbacks, les commentaires manager et les recommandations utiles."
              Icon={MessageSquareMore}
              accentClass="bg-violet-500/10 text-violet-600"
            />
            <JourneyStepCard
              step="4. Suivre mon developpement"
              status={myTrainings.length || myPip ? 'Actif' : 'A preparer'}
              description="Mettre en oeuvre les formations, le coaching ou les actions de renforcement."
              Icon={GraduationCap}
              accentClass="bg-amber-500/10 text-amber-600"
            />
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <DataTable
              title="Mes objectifs"
              description="Ce que je dois livrer pendant la campagne."
              columns={goalJourneyColumns}
              data={myGoals}
              emptyMessage="Aucun objectif affecte"
              renderActions={(row) => (
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: 'goal', record: row })}>
                  Voir
                </Button>
              )}
            />

            <DataTable
              title="Mes feedbacks"
              description="Les retours et messages recents sur ma performance."
              columns={feedbackColumns}
              data={myFeedbacks}
              emptyMessage="Aucun feedback disponible"
              renderActions={(row) => (
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: 'feedback', record: row })}>
                  Lire
                </Button>
              )}
            />

            <DataTable
              title="Mes evaluations"
              description="Mes autoevaluations et les revues deja enregistrees."
              columns={reviewColumns}
              data={myReviews}
              emptyMessage="Aucune evaluation disponible"
              renderActions={(row) => (
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: 'review', record: row })}>
                  Detail
                </Button>
              )}
            />
          </div>

          <div className="space-y-4">
            <Card title="Mon evaluation" subtitle="Lecture rapide de ma situation dans le cycle">
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-sm text-muted">Derniere revue</p>
                  <p className="mt-1 text-base font-semibold text-text">
                    {latestReview ? `${latestReview.reviewType} - ${latestReview.score}/100` : 'Aucune revue'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-sm text-muted">Gratification projetee</p>
                  <p className="mt-1 text-base font-semibold text-text">
                    {latestReward ? formatCurrency(latestReward.gratificationAmount) : 'Aucune projection'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-sm text-muted">Plan de developpement</p>
                  <p className="mt-1 text-base font-semibold text-text">
                    {myPip ? myPip.focus : 'Pas de PIP actif'}
                  </p>
                </div>
              </div>
            </Card>

            <DataTable
              title="Mon developpement"
              description="Formations, coaching et actions de progression."
              columns={trainingColumns}
              data={myTrainings}
              emptyMessage="Aucun plan de developpement"
              renderActions={(row) => (
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: myPip ? 'pip' : 'training', record: myPip || row })}>
                  Suivre
                </Button>
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderRoleViewContent = () => {
    if (activeRoleView === 'manager') {
      return renderManagerJourney();
    }

    if (activeRoleView === 'employee') {
      return renderEmployeeJourney();
    }

    return (
      <div className="space-y-4">
        {renderDrhJourney()}

        <Card contentClassName="p-2">
          <nav className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-background text-text hover:bg-secondary',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {activeTab === 'overview' ? renderOverview() : null}
        {activeTab === 'campaigns' ? renderCampaigns() : null}
        {activeTab === 'reviews' ? renderReviews() : null}
        {activeTab === 'pips' ? renderPips() : null}
        {activeTab === 'rewards' ? renderRewards() : null}
      </div>
    );
  };

  const renderCampaigns = () => (
      <DataTable
        title="Campagnes de performance"
        description="Pilotage des cycles annuels, probation et revues intermediaires."
        columns={campaignColumns}
        data={campaigns}
        emptyMessage="Aucune campagne avec ces filtres"
        onDeleteSelected={(rows) => handleBulkDelete(rows, 'campaign')}
        deleteConfirmConfig={{
          title: 'Supprimer les campagnes',
          description: (rows) => `Voulez-vous vraiment supprimer ${formatCountLabel(rows.length, 'cette campagne', 'ces campagnes')} et les donnees associees ?`,
          confirmLabel: 'Supprimer',
        }}
        renderActions={(row) => performanceRowActions(row, 'campaign')}
      />
  );

  const renderReviews = () => (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-muted">Revue 360</p>
              <p className="text-2xl font-semibold text-text">
                {reviews.filter((item) => item.reviewType.includes('360')).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
              <Target size={20} />
            </div>
            <div>
              <p className="text-sm text-muted">Score moyen</p>
              <p className="text-2xl font-semibold text-text">
                {reviews.length
                  ? Math.round(reviews.reduce((sum, item) => sum + item.score, 0) / reviews.length)
                  : 0}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <CircleAlert size={20} />
            </div>
            <div>
              <p className="text-sm text-muted">Revues bloquees</p>
              <p className="text-2xl font-semibold text-text">
                {reviews.filter((item) => ['pending', 'in progress'].includes(normalize(item.status))).length}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <DataTable
        title="File des evaluations"
        description="Suivi des autoevaluations, revues manager, N2 et feedback 360."
        columns={reviewColumns}
        data={reviews}
        emptyMessage="Aucune evaluation avec ces filtres"
        onDeleteSelected={(rows) => handleBulkDelete(rows, 'review')}
        deleteConfirmConfig={{
          title: 'Supprimer les evaluations',
          description: (rows) => `Voulez-vous vraiment supprimer ${formatCountLabel(rows.length, 'cette evaluation', 'ces evaluations')} ?`,
          confirmLabel: 'Supprimer',
        }}
        renderActions={(row) => performanceRowActions(row, 'review')}
      />
    </div>
  );

  const renderPips = () => (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-muted">PIP actifs</p>
            <p className="text-2xl font-semibold text-text">{pips.filter((item) => normalize(item.status) === 'active').length}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-muted">PIP a risque</p>
            <p className="text-2xl font-semibold text-text">{pips.filter((item) => normalize(item.status) === 'at risk').length}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-muted">Succes de cloture</p>
            <p className="text-2xl font-semibold text-text">
              {pips.length
                ? `${Math.round((pips.filter((item) => normalize(item.status) === 'completed').length / pips.length) * 100)}%`
                : '0%'}
            </p>
          </div>
        </Card>
      </section>

      <DataTable
        title="Plans d amelioration"
        description="Suivi des collaborateurs notes D et E, mentoring et coaching associes."
        columns={pipColumns}
        data={pips}
        emptyMessage="Aucun PIP avec ces filtres"
        onDeleteSelected={(rows) => handleBulkDelete(rows.filter((row) => row.primaryTrainingId).map((row) => {
          const matchedTraining = trainings.find((item) => item.id === row.primaryTrainingId);
          return matchedTraining || null;
        }).filter(Boolean), 'training')}
        deleteConfirmConfig={{
          title: 'Supprimer les plans',
          description: (rows) => {
            const deletableRows = rows.filter((row) => row.primaryTrainingId);
            return deletableRows.length
              ? `Voulez-vous vraiment supprimer ${formatCountLabel(deletableRows.length, 'ce plan', 'ces plans')} de developpement ?`
              : 'Aucun plan de developpement selectionne ne peut etre supprime.';
          },
          confirmLabel: 'Supprimer',
        }}
        renderActions={(row) => performanceRowActions(row, 'pip')}
      />
    </div>
  );

  const renderRewards = () => (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-muted">Gratification projettee</p>
            <p className="text-2xl font-semibold text-text">
              {formatCurrency(rewards.reduce((sum, item) => sum + item.gratificationAmount, 0))}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-muted">Bonus performance</p>
            <p className="text-2xl font-semibold text-text">
              {formatCurrency(rewards.reduce((sum, item) => sum + item.bonusAmount, 0))}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-muted">Prime de merite</p>
            <p className="text-2xl font-semibold text-text">
              {formatCurrency(rewards.reduce((sum, item) => sum + item.meritPrimeAmount, 0))}
            </p>
          </div>
        </Card>
      </section>

      <DataTable
        title="Recompenses et gratification"
        description="Projection issue des notes finales et des regles de distribution."
        columns={rewardColumns}
        data={rewards}
        emptyMessage="Aucune recompense avec ces filtres"
        renderActions={(row) => (
          <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDetail({ kind: 'reward', record: row })}>
            Detail
          </Button>
        )}
      />
    </div>
  );

  const renderSheetContent = () => {
    if (!selectedDetail) {
      return null;
    }

    const { kind, record } = selectedDetail;

    if (kind === 'campaign') {
      return (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card contentClassName="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted">Code</p>
                <p className="text-base font-semibold text-text">{record.code}</p>
              </div>
            </Card>
            <Card contentClassName="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted">Participants</p>
                <p className="text-base font-semibold text-text">{record.participants}</p>
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Description</h4>
            <p className="text-sm leading-6 text-muted">{record.description}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text">Jalons</h4>
            {record.milestones.map((milestone) => (
              <div key={milestone.label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <div>
                  <p className="font-medium text-text">{milestone.label}</p>
                  <p className="text-sm text-muted">{milestone.value}</p>
                </div>
                <StatusBadge status={milestone.status} label={milestone.status} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (kind === 'review') {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <ScoreBandBadge band={record.band} />
            <StatusBadge status={record.status} label={record.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">
              {record.score}/100
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Synthese</h4>
            <p className="text-sm leading-6 text-muted">{record.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Forces" contentClassName="p-4">
              <div className="space-y-2">
                {record.strengths.map((item) => (
                  <div key={item} className="rounded-lg bg-background px-3 py-2 text-sm text-text">
                    {item}
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Axes de progres" contentClassName="p-4">
              <div className="space-y-2">
                {record.developmentAreas.map((item) => (
                  <div key={item} className="rounded-lg bg-background px-3 py-2 text-sm text-text">
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Contributeurs" contentClassName="p-4">
            <div className="flex flex-wrap gap-2">
              {record.reviewers.map((item) => (
                <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-text">
                  {item}
                </span>
              ))}
            </div>
          </Card>
        </div>
      );
    }

    if (kind === 'goal') {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} label={record.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">
              {record.progressPercent}% d avancement
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Objectif</h4>
            <p className="text-sm leading-6 text-muted">{record.title}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Collaborateur" value={record.employee} />
            <DetailRow label="Manager" value={record.manager} />
            <DetailRow label="Cible" value={record.targetValue} />
            <DetailRow label="Echeance" value={record.dueDate} />
          </div>
        </div>
      );
    }

    if (kind === 'feedback') {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.feedbackType} label={record.feedbackType} />
            {record.rating ? (
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">
                {record.rating}/5
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Message</h4>
            <p className="text-sm leading-6 text-muted">{record.message}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Auteur" value={record.author} />
            <DetailRow label="Destinataire" value={record.receiver} />
            <DetailRow label="Type" value={record.feedbackType} />
            <DetailRow label="Date" value={record.createdAt || '-'} />
          </div>
        </div>
      );
    }

    if (kind === 'pip') {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <ScoreBandBadge band={record.initialBand} />
            <StatusBadge status={record.status} label={record.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">
              {record.progress}% d avancement
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Objectif du plan</h4>
            <p className="text-sm leading-6 text-muted">{record.focus}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Mentoring" value={record.mentoring} />
            <DetailRow label="Coaching" value={record.coaching} />
            <DetailRow label="Prochaine revue" value={record.nextReview} />
            <DetailRow label="Duree" value={record.durationLabel} />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text">Actions de suivi</h4>
            {record.actions.map((action) => (
              <div key={action.title} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-text">{action.title}</p>
                  <StatusBadge status={action.status} label={action.status} />
                </div>
                <p className="mt-2 text-sm text-muted">{action.owner}</p>
                <p className="mt-1 text-xs text-muted">Echeance : {action.dueDate}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (kind === 'training') {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} label={record.status} />
            {record.score ? (
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">
                {record.score}/100
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Collaborateur" value={record.employee} />
            <DetailRow label="Provider" value={record.provider || '-'} />
            <DetailRow label="Debut" value={record.startDate || '-'} />
            <DetailRow label="Fin" value={record.endDate || '-'} />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Plan</h4>
            <p className="text-sm leading-6 text-muted">{record.title}</p>
          </div>

          {record.notes ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-text">Notes</h4>
              <p className="text-sm leading-6 text-muted">{record.notes}</p>
            </div>
          ) : null}
        </div>
      );
    }

    if (kind === 'reward') {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <ScoreBandBadge band={record.band} />
            <StatusBadge status={record.status} label={record.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">
              {record.score}/100
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Commentaire RH</h4>
            <p className="text-sm leading-6 text-muted">{record.commentary}</p>
          </div>

          <div className="space-y-3">
            {record.components.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                <span className="text-sm font-medium text-text">{item.label}</span>
                <span className="text-sm font-semibold text-text">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (kind === 'highlight') {
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <ScoreBandBadge band={record.band} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">
              {record.score}/100
            </span>
          </div>

          <DetailRow label="Collaborateur" value={record.employee} />
          <DetailRow label="Fonction" value={record.role} />
          <DetailRow label="Direction" value={record.direction} />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Fait marquant</h4>
            <p className="text-sm leading-6 text-muted">{record.insight}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderActionSheetContent = () => {
    const actionType = typeof actionSheet === 'string' ? actionSheet : actionSheet?.type;

    if (actionType === 'createCampaign' || actionType === 'editCampaign') {
      return (
        <form id="create-performance-campaign-form" className="space-y-4" onSubmit={actionType === 'createCampaign' ? handleCreateCampaign : handleUpdateCampaign}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Code campagne"
              value={campaignForm.code}
              onChange={(event) => setCampaignForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="PERF-2027"
            />
            <Input
              label="Nom de campagne"
              value={campaignForm.name}
              onChange={(event) => setCampaignForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Campagne annuelle 2027"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Date de debut"
              type="date"
              value={campaignForm.periodStart}
              onChange={(event) => setCampaignForm((current) => ({ ...current, periodStart: event.target.value }))}
            />
            <Input
              label="Date de fin"
              type="date"
              value={campaignForm.periodEnd}
              onChange={(event) => setCampaignForm((current) => ({ ...current, periodEnd: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Statut initial"
              value={campaignForm.status}
              onChange={(value) => setCampaignForm((current) => ({ ...current, status: String(value) }))}
              options={[
                { value: 'DRAFT', label: 'Brouillon' },
                { value: 'ACTIVE', label: 'Active' },
              ]}
            />
            <Input
              label="Population estimee"
              type="number"
              min="0"
              value={campaignForm.participants}
              onChange={(event) => setCampaignForm((current) => ({ ...current, participants: event.target.value }))}
              placeholder="120"
            />
          </div>

          <TextAreaField
            label="Description"
            value={campaignForm.description}
            onChange={(value) => setCampaignForm((current) => ({ ...current, description: value }))}
            placeholder="Cadre, population cible et regles de la campagne."
          />
        </form>
      );
    }

    if (actionType === 'launchCalibration') {
      return (
        <form id="launch-performance-calibration-form" className="space-y-4" onSubmit={handleLaunchCalibration}>
          <DropdownSelect
            label="Campagne a lancer"
            value={calibrationForm.campaignId}
            onChange={(value) => setCalibrationForm((current) => ({ ...current, campaignId: String(value) }))}
            options={campaignOptions}
            placeholder="Choisir une campagne"
          />
        </form>
      );
    }

    if (actionType === 'createReview' || actionType === 'editReview') {
      return (
        <form id="create-performance-review-form" className="space-y-4" onSubmit={actionType === 'createReview' ? handleCreateReview : handleUpdateReview}>
          <DropdownSelect
            label="Campagne"
            value={reviewForm.cycleId}
            onChange={(value) => setReviewForm((current) => ({ ...current, cycleId: String(value) }))}
            options={filterOptions.cycles.filter((option) => option.value !== 'all')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Collaborateur evalue"
              value={reviewForm.revieweeEmployeeId}
              onChange={(value) => setReviewForm((current) => ({ ...current, revieweeEmployeeId: String(value) }))}
              options={employeeOptions}
            />
            <DropdownSelect
              label="Evaluateur"
              value={reviewForm.reviewerEmployeeId}
              onChange={(value) => setReviewForm((current) => ({ ...current, reviewerEmployeeId: String(value) }))}
              options={employeeOptions}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Type de revue"
              value={reviewForm.reviewType}
              onChange={(value) => setReviewForm((current) => ({ ...current, reviewType: String(value) }))}
              options={REVIEW_TYPE_OPTIONS}
            />
            <Input
              label="Score"
              type="number"
              min="0"
              max="100"
              value={reviewForm.overallScore}
              onChange={(event) => setReviewForm((current) => ({ ...current, overallScore: event.target.value }))}
              placeholder="84"
            />
          </div>
          <TextAreaField
            label="Forces"
            value={reviewForm.strengths}
            onChange={(value) => setReviewForm((current) => ({ ...current, strengths: value }))}
            placeholder="Precision analytique, leadership..."
            rows={3}
          />
          <TextAreaField
            label="Axes de progres"
            value={reviewForm.developmentAreas}
            onChange={(value) => setReviewForm((current) => ({ ...current, developmentAreas: value }))}
            placeholder="Communication, mentoring..."
            rows={3}
          />
          <TextAreaField
            label="Commentaire"
            value={reviewForm.comments}
            onChange={(value) => setReviewForm((current) => ({ ...current, comments: value }))}
            placeholder="Synthese de l evaluation."
            rows={3}
          />
        </form>
      );
    }

    if (actionType === 'createFeedback') {
      return (
        <form id="create-performance-feedback-form" className="space-y-4" onSubmit={handleCreateFeedback}>
          <DropdownSelect
            label="Campagne"
            value={feedbackForm.cycleId}
            onChange={(value) => setFeedbackForm((current) => ({ ...current, cycleId: String(value) }))}
            options={filterOptions.cycles.filter((option) => option.value !== 'all')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Auteur"
              value={feedbackForm.fromEmployeeId}
              onChange={(value) => setFeedbackForm((current) => ({ ...current, fromEmployeeId: String(value) }))}
              options={employeeOptions}
            />
            <DropdownSelect
              label="Destinataire"
              value={feedbackForm.toEmployeeId}
              onChange={(value) => setFeedbackForm((current) => ({ ...current, toEmployeeId: String(value) }))}
              options={employeeOptions}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Type"
              value={feedbackForm.feedbackType}
              onChange={(value) => setFeedbackForm((current) => ({ ...current, feedbackType: String(value) }))}
              options={FEEDBACK_TYPE_OPTIONS}
            />
            <Input
              label="Note"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={feedbackForm.rating}
              onChange={(event) => setFeedbackForm((current) => ({ ...current, rating: event.target.value }))}
              placeholder="4.5"
            />
          </div>
          <Input
            label="Titre"
            value={feedbackForm.title}
            onChange={(event) => setFeedbackForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Point de coaching mensuel"
          />
          <TextAreaField
            label="Message"
            value={feedbackForm.message}
            onChange={(value) => setFeedbackForm((current) => ({ ...current, message: value }))}
            placeholder="Feedback detaille."
          />
        </form>
      );
    }

    if (actionType === 'createTraining' || actionType === 'editTraining') {
      return (
        <form id="create-performance-training-form" className="space-y-4" onSubmit={actionType === 'createTraining' ? handleCreateTraining : handleUpdateTraining}>
          <DropdownSelect
            label="Collaborateur"
            value={trainingForm.employeeId}
            onChange={(value) => setTrainingForm((current) => ({ ...current, employeeId: String(value) }))}
            options={employeeOptions}
          />
          <DropdownSelect
            label="Campagne"
            value={trainingForm.cycleId}
            onChange={(value) => setTrainingForm((current) => ({ ...current, cycleId: String(value) }))}
            options={filterOptions.cycles.filter((option) => option.value !== 'all')}
          />
          <Input
            label="Titre"
            value={trainingForm.title}
            onChange={(event) => setTrainingForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Formation memo de credit"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Provider"
              value={trainingForm.provider}
              onChange={(event) => setTrainingForm((current) => ({ ...current, provider: event.target.value }))}
              placeholder="Academie RH"
            />
            <DropdownSelect
              label="Statut"
              value={trainingForm.status}
              onChange={(value) => setTrainingForm((current) => ({ ...current, status: String(value) }))}
              options={TRAINING_STATUS_OPTIONS}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Debut"
              type="date"
              value={trainingForm.startDate}
              onChange={(event) => setTrainingForm((current) => ({ ...current, startDate: event.target.value }))}
            />
            <Input
              label="Fin"
              type="date"
              value={trainingForm.endDate}
              onChange={(event) => setTrainingForm((current) => ({ ...current, endDate: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Heures"
              type="number"
              min="0"
              value={trainingForm.hours}
              onChange={(event) => setTrainingForm((current) => ({ ...current, hours: event.target.value }))}
              placeholder="14"
            />
            <Input
              label="Score final"
              type="number"
              min="0"
              max="100"
              value={trainingForm.score}
              onChange={(event) => setTrainingForm((current) => ({ ...current, score: event.target.value }))}
              placeholder="88"
            />
          </div>
          <TextAreaField
            label="Notes"
            value={trainingForm.notes}
            onChange={(value) => setTrainingForm((current) => ({ ...current, notes: value }))}
            placeholder="Contexte et objectif du plan."
          />
        </form>
      );
    }

    return null;
  };

  const renderActionSheetFooter = () => (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="secondary" onClick={resetActionSheet} disabled={isSubmittingAction}>
        Annuler
      </Button>
      <Button
        type="submit"
        form={
          (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createCampaign' || (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editCampaign' ? 'create-performance-campaign-form'
            : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'launchCalibration' ? 'launch-performance-calibration-form'
              : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createReview' || (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editReview' ? 'create-performance-review-form'
                : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createFeedback' ? 'create-performance-feedback-form'
                  : 'create-performance-training-form'
        }
        disabled={isSubmittingAction}
      >
        {isSubmittingAction
          ? 'Enregistrement...'
          : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createCampaign'
            ? 'Creer la campagne'
            : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editCampaign'
              ? 'Mettre a jour la campagne'
            : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'launchCalibration'
              ? 'Lancer la calibration'
              : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createReview'
                ? 'Creer l evaluation'
                : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editReview'
                  ? 'Mettre a jour l evaluation'
                : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createFeedback'
                  ? 'Creer le feedback'
                  : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editTraining'
                    ? 'Mettre a jour le plan'
                    : 'Creer le plan'}
      </Button>
    </div>
  );

  const actionSheetMeta = {
    createCampaign: {
      title: 'Creer une campagne de performance',
      description: 'Prepare un nouveau cycle de performance avec ses dates et son cadrage.',
    },
    editCampaign: {
      title: 'Modifier une campagne',
      description: 'Ajuste le cycle, les dates et le cadrage de la campagne.',
    },
    launchCalibration: {
      title: 'Lancer la calibration',
      description: 'Active une campagne deja creee pour ouvrir la phase de calibration.',
    },
    createReview: {
      title: 'Ajouter une evaluation',
      description: 'Enregistre une revue collaborateur avec score, forces et axes de progres.',
    },
    editReview: {
      title: 'Modifier une evaluation',
      description: 'Met a jour le score, le statut et les commentaires de la revue.',
    },
    createFeedback: {
      title: 'Ajouter un feedback',
      description: 'Formalise un retour de coaching, de reconnaissance ou un feedback constructif.',
    },
    createTraining: {
      title: 'Ajouter un plan de developpement',
      description: 'Declenche une action de formation ou d accompagnement dans le cycle courant.',
    },
    editTraining: {
      title: 'Modifier un plan de developpement',
      description: 'Ajuste les dates, le statut et les notes du plan de developpement.',
    },
  };

  const activeRoleMeta = ROLE_VIEWS.find((item) => item.id === activeRoleView) || ROLE_VIEWS[0];

  const renderRoleActions = () => {
    if (activeRoleView === 'manager') {
      return (
        <>
          {accessFlags.canCreateReviews ? (
            <Button type="button" variant="secondary" onClick={openCreateReviewSheet}>
              <ClipboardCheck size={16} />
              Ajouter une evaluation
            </Button>
          ) : null}
          {accessFlags.canCreateFeedbacks ? (
            <Button type="button" variant="secondary" onClick={openCreateFeedbackSheet}>
              <MessageSquareMore size={16} />
              Ajouter un feedback
            </Button>
          ) : null}
          {accessFlags.canCreateTrainings ? (
            <Button type="button" onClick={openCreateTrainingSheet}>
              <GraduationCap size={16} />
              Ajouter un plan
            </Button>
          ) : null}
        </>
      );
    }

    if (activeRoleView === 'employee') {
      return accessFlags.canCreateReviews ? (
        <Button type="button" onClick={openSelfReviewSheet}>
          <FileText size={16} />
          Commencer mon autoevaluation
        </Button>
      ) : null;
    }

    return (
      <>
        {(activeTab === 'overview' || activeTab === 'campaigns') && accessFlags.canCreateCycles ? (
          <>
            <Button type="button" variant="secondary" onClick={openCreateCampaignSheet}>
              <CalendarClock size={16} />
              Creer une campagne
            </Button>
            {accessFlags.canUpdateCycles ? (
              <Button type="button" onClick={openCalibrationSheet}>
                <Sparkles size={16} />
                Lancer la calibration
              </Button>
            ) : null}
          </>
        ) : null}
        {activeTab === 'reviews' ? (
          <>
            {accessFlags.canCreateReviews ? (
              <Button type="button" variant="secondary" onClick={openCreateReviewSheet}>
                <ClipboardCheck size={16} />
                Ajouter une evaluation
              </Button>
            ) : null}
            {accessFlags.canCreateFeedbacks ? (
              <Button type="button" onClick={openCreateFeedbackSheet}>
                <Sparkles size={16} />
                Ajouter un feedback
              </Button>
            ) : null}
          </>
        ) : null}
        {activeTab === 'pips' && accessFlags.canCreateTrainings ? (
          <Button type="button" onClick={openCreateTrainingSheet}>
            <Target size={16} />
            Ajouter un plan de developpement
          </Button>
        ) : null}
      </>
    );
  };

  const renderNoAccessState = () => (
    <Card contentClassName="p-6">
      <div className="space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text">Acces performance indisponible</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Votre compte n a pas encore le module `PERFORMANCE_360` ou les permissions de lecture associees.
            Attribuez le module et les droits `performance.*.read` pour ouvrir la vue metier adaptee.
          </p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Performances', href: '/Performances' },
          { label: activeRoleView === 'drh' ? (TABS.find((item) => item.id === activeTab)?.label || 'Vue d ensemble') : activeRoleMeta.label },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text">Performances</h2>
          <p className="text-sm text-muted">
            {activeRoleView === 'drh'
              ? 'Pilote les campagnes d evaluation, les plans d amelioration et les decisions RH issues des resultats.'
              : activeRoleView === 'manager'
                ? 'Suivez votre equipe, rendez les evaluations et accompagnez les plans de progression.'
                : 'Retrouvez vos objectifs, votre autoevaluation et les suites de votre campagne de performance.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {renderRoleActions()}
        </div>
      </div>

      {allowedRoleViews.length > 1 ? (
        <Card contentClassName="p-2">
          <div className={`grid gap-2 ${allowedRoleViews.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {allowedRoleViews.map((view) => {
            const Icon = view.icon;
            const isActive = activeRoleView === view.id;

            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveRoleView(view.id)}
                className={[
                  'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-text hover:bg-secondary/60',
                ].join(' ')}
              >
                <div>
                  <p className="text-sm font-semibold">{view.label}</p>
                  <p className="mt-1 text-xs text-muted">
                    {view.id === 'drh'
                      ? 'Vue complete de pilotage RH.'
                      : view.id === 'manager'
                        ? 'Vue equipe, revues et accompagnement.'
                        : 'Vue personnelle du cycle de performance.'}
                  </p>
                </div>
                <Icon size={18} />
              </button>
            );
            })}
          </div>
        </Card>
      ) : null}

      {!hasPerformanceAccess ? renderNoAccessState() : null}

      {hasPerformanceAccess ? (
        <Card contentClassName="p-3">
        <div className={`grid gap-3 ${activeRoleView === 'drh' ? 'xl:grid-cols-[minmax(0,1fr)_220px_220px_220px]' : 'xl:grid-cols-[minmax(0,1fr)_220px]'}`}>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un collaborateur, une campagne ou une action..."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <DropdownSelect
            value={selectedCycle}
            onChange={(value) => setSelectedCycle(String(value))}
            options={filterOptions.cycles}
            buttonClassName="bg-background"
          />

          {activeRoleView === 'drh' ? (
            <>
              <DropdownSelect
                value={selectedDirection}
                onChange={(value) => setSelectedDirection(String(value))}
                options={filterOptions.directions}
                buttonClassName="bg-background"
              />

              <DropdownSelect
                value={selectedManager}
                onChange={(value) => setSelectedManager(String(value))}
                options={filterOptions.managers}
                buttonClassName="bg-background"
              />
            </>
          ) : null}
        </div>
        </Card>
      ) : null}

      {hasPerformanceAccess && isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} contentClassName="p-5">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-background" />
                <div className="h-8 w-20 rounded bg-background" />
                <div className="h-3 w-40 rounded bg-background" />
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {hasPerformanceAccess && !isLoading ? renderRoleViewContent() : null}

      <Sheet
        open={Boolean(actionSheet)}
        onClose={resetActionSheet}
        title={actionSheet ? actionSheetMeta[typeof actionSheet === 'string' ? actionSheet : actionSheet?.type]?.title : ''}
        description={actionSheet ? actionSheetMeta[typeof actionSheet === 'string' ? actionSheet : actionSheet?.type]?.description : ''}
        size="md"
        footer={renderActionSheetFooter()}
      >
        {renderActionSheetContent()}
      </Sheet>

      <Sheet
        open={Boolean(selectedDetail)}
        onClose={() => setSelectedDetail(null)}
        title={
          selectedDetail?.kind === 'campaign' ? selectedDetail?.record?.name
            : selectedDetail?.kind === 'review' ? `Evaluation - ${selectedDetail?.record?.employee}`
              : selectedDetail?.kind === 'goal' ? `Objectif - ${selectedDetail?.record?.employee}`
                : selectedDetail?.kind === 'feedback' ? selectedDetail?.record?.title
                  : selectedDetail?.kind === 'training' ? selectedDetail?.record?.title
              : selectedDetail?.kind === 'pip' ? `PIP - ${selectedDetail?.record?.employee}`
                : selectedDetail?.kind === 'reward' ? `Recompense - ${selectedDetail?.record?.employee}`
                  : selectedDetail?.kind === 'highlight' ? selectedDetail?.record?.employee
                    : 'Detail'
        }
        description={
          selectedDetail?.kind === 'campaign' ? 'Lecture detaillee de la campagne.'
            : selectedDetail?.kind === 'review' ? 'Synthese des forces, axes de progres et etapes suivantes.'
              : selectedDetail?.kind === 'goal' ? 'Lecture detaillee de l objectif individuel.'
                : selectedDetail?.kind === 'feedback' ? 'Message, auteur et contexte du feedback.'
                  : selectedDetail?.kind === 'training' ? 'Suivi du plan de developpement et de ses jalons.'
              : selectedDetail?.kind === 'pip' ? 'Plan d accompagnement, revues et actions associees.'
                : selectedDetail?.kind === 'reward' ? 'Projection de gratification, bonus et prime de merite.'
                  : selectedDetail?.kind === 'highlight' ? 'Profil mis en avant dans la campagne.'
                    : ''
        }
        size="lg"
      >
        {renderSheetContent()}
      </Sheet>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!isSubmittingAction) {
            closeDeleteModal();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Confirmation de suppression"
        description={
          deleteTarget?.kind === 'campaign'
            ? 'Voulez-vous vraiment supprimer cette campagne et ses donnees liees ?'
            : deleteTarget?.kind === 'review'
              ? 'Voulez-vous vraiment supprimer cette evaluation ?'
              : 'Voulez-vous vraiment supprimer ce plan de developpement ?'
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={isSubmittingAction}
      />
    </div>
  );
}

export default Performances;
