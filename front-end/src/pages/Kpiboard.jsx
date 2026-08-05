import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  EllipsisVertical,
  Gauge,
  Eye,
  Pencil,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Users,
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
  createKpiCheckIn,
  createKpiAssignmentWorkflow,
  createKpiDefinition,
  createPerformanceGoal,
  deleteKpiAssignment,
  deleteKpiCheckIn,
  deleteKpiDefinition,
  deletePerformanceGoal,
  getKpiAssignments,
  getKpiBoardDashboard,
  getKpiCheckIns,
  getKpiDefinitions,
  getKpiGoals,
  getPerformanceFilterOptions,
  updateKpiAssignment,
  updateKpiCheckIn,
  updateKpiDefinition,
  updatePerformanceGoal,
} from '../services/performanceApi';

const TABS = [
  { id: 'overview', label: 'Vue d ensemble' },
  { id: 'catalog', label: 'Catalogue KPI' },
  { id: 'assignments', label: 'Affectations' },
  { id: 'goals', label: 'Objectifs' },
  { id: 'checkins', label: 'Check-ins' },
  { id: 'analytics', label: 'Analytique' },
];

const PRIORITY_TONE = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

const EMPTY_FILTER_OPTIONS = {
  cycles: [{ value: 'all', label: 'Toutes les campagnes' }],
  directions: [{ value: 'all', label: 'Toutes les directions' }],
  managers: [{ value: 'all', label: 'Tous les managers' }],
  employees: [],
};

const EMPTY_DASHBOARD = {
  definitions: [],
  assignments: [],
  goals: [],
  checkIns: [],
  analytics: [],
  summary: {
    activeKpis: 0,
    atRiskGoals: 0,
    averageCompletion: 0,
    completedCheckIns: 0,
    topDirection: null,
    projectedImpactLabel: '$0',
  },
};

const KPI_SCOPE_OPTIONS = [
  { value: 'BANK', label: 'Banque' },
  { value: 'DIVISION', label: 'Division' },
  { value: 'DEPARTMENT', label: 'Departement' },
  { value: 'TEAM', label: 'Equipe' },
  { value: 'EMPLOYEE', label: 'Employe' },
];

const KPI_METRIC_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Pourcentage' },
  { value: 'NUMBER', label: 'Nombre' },
  { value: 'CURRENCY', label: 'Montant' },
  { value: 'RATIO', label: 'Ratio' },
];

const KPI_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Draft', label: 'Brouillon' },
];

const ASSIGNMENT_RISK_OPTIONS = [
  { value: 'Low', label: 'Faible' },
  { value: 'Medium', label: 'Moyen' },
  { value: 'High', label: 'Eleve' },
];

const CHECKIN_STATUS_OPTIONS = [
  { value: 'Scheduled', label: 'Planifie' },
  { value: 'Done', label: 'Termine' },
  { value: 'Blocked', label: 'Bloque' },
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

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasRequiredValues(values = []) {
  return values.every((value) => String(value ?? '').trim() !== '');
}

function formatCountLabel(count, singular, plural) {
  return count > 1 ? `${count} ${plural}` : `${count} ${singular}`;
}

function SummaryCard({ title, value, subtitle, accent, Icon }) {
  return (
    <Card contentClassName="p-5">
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

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[minmax(0,180px)_1fr] gap-4 border-b border-border/70 py-3 last:border-b-0">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}

function RiskBadge({ value }) {
  const normalized = normalize(value);

  return (
    <StatusBadge
      status={value}
      label={value}
      tone={PRIORITY_TONE[normalized] || 'neutral'}
      size="sm"
    />
  );
}

function Kpiboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedManager, setSelectedManager] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [definitions, setDefinitions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionSheet, setActionSheet] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [kpiForm, setKpiForm] = useState({
    code: '',
    name: '',
    scope: 'TEAM',
    directionName: '',
    managerEmployeeId: '',
    metricType: 'PERCENTAGE',
    unit: '%',
    defaultWeight: '10',
    ownerLabel: 'Ressources humaines',
    status: 'Draft',
    description: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    employeeId: '',
    cycleId: '',
    managerEmployeeId: '',
    assignedKpis: '3',
    totalWeight: '100',
    completionPercent: '0',
    riskLevel: 'Medium',
    kpiDefinitionId: '',
    goalTitle: '',
    targetValue: '',
    dueDate: '31 dec. 2026',
    summary: '',
    goalNote: '',
  });
  const [goalForm, setGoalForm] = useState({
    employeeId: '',
    cycleId: '',
    kpiDefinitionId: '',
    title: '',
    targetValue: '',
    achievedValue: '',
    progressPercent: '0',
    weight: '20',
    dueDate: '',
    note: '',
    status: 'IN_PROGRESS',
  });
  const [checkInForm, setCheckInForm] = useState({
    goalId: '',
    title: '',
    checkInDate: '',
    progressPercent: '0',
    blocker: '',
    supportNeeded: '',
    nextActions: '',
    status: 'Scheduled',
  });

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
    let cancelled = false;

    getPerformanceFilterOptions()
      .then((payload) => {
        if (!cancelled) {
          setFilterOptions(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Impossible de charger les filtres KPI.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);

        const [
          dashboardPayload,
          definitionsPayload,
          assignmentsPayload,
          goalsPayload,
          checkInsPayload,
        ] = await Promise.all([
          getKpiBoardDashboard(activeFilters),
          getKpiDefinitions(activeFilters),
          getKpiAssignments(activeFilters),
          getKpiGoals(activeFilters),
          getKpiCheckIns(activeFilters),
        ]);

        if (cancelled) {
          return;
        }

        setDashboard(dashboardPayload);
        setDefinitions(definitionsPayload);
        setAssignments(assignmentsPayload);
        setGoals(goalsPayload);
        setCheckIns(checkInsPayload);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger les donnees KPI.');
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
  }, [activeFilters, reloadKey, toast]);

  const employeeOptions = useMemo(
    () => (filterOptions.employees || []).map((item) => ({
      value: item.value,
      label: item.label,
    })),
    [filterOptions.employees],
  );

  const kpiDefinitionOptions = useMemo(
    () => definitions.map((item) => ({
      value: item.id,
      label: `${item.code} - ${item.name}`,
    })),
    [definitions],
  );

  const goalOptions = useMemo(
    () => goals.map((item) => ({
      value: item.id,
      label: `${item.employee} - ${item.title}`,
    })),
    [goals],
  );

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
        if (kind === 'definition') {
          return deleteKpiDefinition(row.id);
        }
        if (kind === 'assignment') {
          return deleteKpiAssignment(row.id);
        }
        if (kind === 'goal') {
          return deletePerformanceGoal(row.id);
        }
        if (kind === 'checkin') {
          return deleteKpiCheckIn(row.id);
        }
        return Promise.resolve();
      });

      await Promise.all(tasks);

      const successLabel = kind === 'definition'
        ? formatCountLabel(safeRows.length, 'KPI supprime', 'KPI supprimes')
        : kind === 'assignment'
          ? formatCountLabel(safeRows.length, 'affectation supprimee', 'affectations supprimees')
          : kind === 'goal'
            ? formatCountLabel(safeRows.length, 'objectif supprime', 'objectifs supprimes')
            : formatCountLabel(safeRows.length, 'check-in supprime', 'check-ins supprimes');

      toast.success(`${successLabel}.`);
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer la selection KPI.');
    }
  };

  const openCreateKpiSheet = () => {
    setKpiForm({
      code: '',
      name: '',
      scope: 'TEAM',
      directionName: filterOptions.directions.find((option) => option.value === selectedDirection)?.label || '',
      managerEmployeeId: filterOptions.managers.find((option) => option.value === selectedManager)?.originalValue || '',
      metricType: 'PERCENTAGE',
      unit: '%',
      defaultWeight: '10',
      ownerLabel: 'Ressources humaines',
      status: 'Draft',
      description: '',
    });
    setActionSheet('createKpi');
  };

  const openEditKpiSheet = (definition) => {
    setKpiForm({
      code: definition.code || '',
      name: definition.name || '',
      scope: definition.scope || 'TEAM',
      directionName: definition.raw?.directionName || '',
      managerEmployeeId: definition.raw?.managerEmployee?.id || '',
      metricType: definition.metricType || 'PERCENTAGE',
      unit: definition.unit || '',
      defaultWeight: String(definition.defaultWeight || ''),
      ownerLabel: definition.owner || '',
      status: definition.status || 'Draft',
      description: definition.description || '',
    });
    setActionSheet({ type: 'editKpi', record: definition });
  };

  const openMassAssignmentSheet = () => {
    setAssignmentForm({
      employeeId: filterOptions.employees[0]?.value || '',
      cycleId: selectedCycle !== 'all' ? selectedCycle : filterOptions.cycles[1]?.value || '',
      managerEmployeeId: filterOptions.managers.find((option) => option.value === selectedManager)?.originalValue || filterOptions.employees[1]?.value || '',
      assignedKpis: '3',
      totalWeight: '100',
      completionPercent: '0',
      riskLevel: 'Medium',
      kpiDefinitionId: definitions[0]?.id || '',
      goalTitle: '',
      targetValue: '',
      dueDate: '31 dec. 2026',
      summary: '',
      goalNote: '',
    });
    setActionSheet('assignKpis');
  };

  const openEditAssignmentSheet = (assignment) => {
    setAssignmentForm({
      employeeId: assignment.employeeId || '',
      cycleId: assignment.cycle || '',
      managerEmployeeId: assignment.raw?.managerEmployee?.id || '',
      assignedKpis: String(assignment.assignedKpis || 0),
      totalWeight: String(assignment.totalWeight || 0),
      completionPercent: String(assignment.completion || 0),
      riskLevel: assignment.riskLevel || 'Medium',
      kpiDefinitionId: '',
      goalTitle: '',
      targetValue: '',
      dueDate: '',
      summary: assignment.summary || '',
      goalNote: '',
    });
    setActionSheet({ type: 'editAssignment', record: assignment });
  };

  const openCreateGoalSheet = () => {
    setGoalForm({
      employeeId: filterOptions.employees[0]?.value || '',
      cycleId: selectedCycle !== 'all' ? selectedCycle : filterOptions.cycles[1]?.value || '',
      kpiDefinitionId: definitions[0]?.id || '',
      title: '',
      targetValue: '',
      achievedValue: '',
      progressPercent: '0',
      weight: '20',
      dueDate: '',
      note: '',
      status: 'IN_PROGRESS',
    });
    setActionSheet('createGoal');
  };

  const openEditGoalSheet = (goal) => {
    setGoalForm({
      employeeId: goal.employeeId || '',
      cycleId: goal.cycle || '',
      kpiDefinitionId: goal.raw?.kpiDefinition?.id || '',
      title: goal.title || '',
      targetValue: goal.targetValue || '',
      achievedValue: goal.achievedValue || '',
      progressPercent: String(goal.progressPercent || 0),
      weight: String(goal.weight || 0),
      dueDate: goal.raw?.dueDate ? String(goal.raw.dueDate).slice(0, 10) : '',
      note: goal.note || '',
      status: goal.raw?.status || 'IN_PROGRESS',
    });
    setActionSheet({ type: 'editGoal', record: goal });
  };

  const openCreateCheckInSheet = () => {
    setCheckInForm({
      goalId: goals[0]?.id || '',
      title: '',
      checkInDate: '',
      progressPercent: '0',
      blocker: '',
      supportNeeded: '',
      nextActions: '',
      status: 'Scheduled',
    });
    setActionSheet('createCheckIn');
  };

  const openEditCheckInSheet = (checkIn) => {
    setCheckInForm({
      goalId: checkIn.raw?.goal?.id || '',
      title: checkIn.title || '',
      checkInDate: checkIn.raw?.checkInDate ? String(checkIn.raw.checkInDate).slice(0, 10) : '',
      progressPercent: String(checkIn.progressPercent || 0),
      blocker: checkIn.blocker === 'Aucun blocker remonte.' ? '' : checkIn.blocker || '',
      supportNeeded: checkIn.supportNeeded === 'Aucun support particulier.' ? '' : checkIn.supportNeeded || '',
      nextActions: checkIn.nextActions === 'Aucune action definie.' ? '' : checkIn.nextActions || '',
      status: checkIn.status || 'Scheduled',
    });
    setActionSheet({ type: 'editCheckIn', record: checkIn });
  };

  const handleCreateKpi = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([kpiForm.code, kpiForm.name, kpiForm.scope, kpiForm.metricType])) {
      toast.error('Renseigne le code, le nom, le scope et le type de mesure.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createKpiDefinition(kpiForm);
      toast.success(`KPI cree : ${kpiForm.code} - ${kpiForm.name}.`);
      setActiveTab('catalog');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer le KPI.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateKpi = async (event) => {
    event.preventDefault();

    const definitionId = actionSheet?.record?.id;
    if (!definitionId) {
      toast.error('KPI introuvable pour la mise a jour.');
      return;
    }

    if (!hasRequiredValues([kpiForm.code, kpiForm.name, kpiForm.scope, kpiForm.metricType])) {
      toast.error('Renseigne le code, le nom, le scope et le type de mesure.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await updateKpiDefinition(definitionId, kpiForm);
      toast.success(`KPI mis a jour : ${kpiForm.code} - ${kpiForm.name}.`);
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour le KPI.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAssignmentWorkflow = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([assignmentForm.employeeId, assignmentForm.cycleId])) {
      toast.error('Choisis le collaborateur et la campagne avant l affectation.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createKpiAssignmentWorkflow(assignmentForm);
      toast.success('Portefeuille KPI affecte au collaborateur selectionne.');
      setActiveTab('assignments');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer l affectation.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateAssignment = async (event) => {
    event.preventDefault();

    const assignmentId = actionSheet?.record?.id;
    if (!assignmentId) {
      toast.error('Affectation introuvable pour la mise a jour.');
      return;
    }

    if (!hasRequiredValues([assignmentForm.employeeId, assignmentForm.cycleId])) {
      toast.error('Choisis le collaborateur et la campagne avant l affectation.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await updateKpiAssignment(assignmentId, {
        employeeId: assignmentForm.employeeId,
        cycleId: assignmentForm.cycleId,
        managerEmployeeId: assignmentForm.managerEmployeeId,
        assignedKpis: assignmentForm.assignedKpis,
        totalWeight: assignmentForm.totalWeight,
        completionPercent: assignmentForm.completionPercent,
        riskLevel: assignmentForm.riskLevel,
        summary: assignmentForm.summary,
      });
      toast.success('Affectation KPI mise a jour.');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour l affectation.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCreateGoal = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([goalForm.employeeId, goalForm.cycleId, goalForm.title])) {
      toast.error('Choisis le collaborateur, la campagne et renseigne le titre de l objectif.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createPerformanceGoal(goalForm);
      toast.success(`Objectif cree : ${goalForm.title}.`);
      setActiveTab('goals');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer l objectif.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateGoal = async (event) => {
    event.preventDefault();

    const goalId = actionSheet?.record?.id;
    if (!goalId) {
      toast.error('Objectif introuvable pour la mise a jour.');
      return;
    }

    if (!hasRequiredValues([goalForm.employeeId, goalForm.cycleId, goalForm.title])) {
      toast.error('Choisis le collaborateur, la campagne et renseigne le titre de l objectif.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await updatePerformanceGoal(goalId, goalForm);
      toast.success(`Objectif mis a jour : ${goalForm.title}.`);
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour l objectif.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCreateCheckIn = async (event) => {
    event.preventDefault();

    if (!hasRequiredValues([checkInForm.goalId, checkInForm.title, checkInForm.checkInDate])) {
      toast.error('Choisis l objectif, le titre et la date du check-in.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await createKpiCheckIn(checkInForm);
      toast.success(`Check-in cree : ${checkInForm.title}.`);
      setActiveTab('checkins');
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer le check-in.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateCheckIn = async (event) => {
    event.preventDefault();

    const checkInId = actionSheet?.record?.id;
    if (!checkInId) {
      toast.error('Check-in introuvable pour la mise a jour.');
      return;
    }

    if (!hasRequiredValues([checkInForm.goalId, checkInForm.title, checkInForm.checkInDate])) {
      toast.error('Choisis l objectif, le titre et la date du check-in.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      await updateKpiCheckIn(checkInId, checkInForm);
      toast.success(`Check-in mis a jour : ${checkInForm.title}.`);
      setReloadKey((value) => value + 1);
      resetActionSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour le check-in.');
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

      if (deleteTarget.kind === 'definition') {
        await deleteKpiDefinition(deleteTarget.record.id);
      } else if (deleteTarget.kind === 'assignment') {
        await deleteKpiAssignment(deleteTarget.record.id);
      } else if (deleteTarget.kind === 'goal') {
        await deletePerformanceGoal(deleteTarget.record.id);
      } else if (deleteTarget.kind === 'checkin') {
        await deleteKpiCheckIn(deleteTarget.record.id);
      }

      toast.success(
        deleteTarget.kind === 'definition'
          ? `KPI supprime : ${deleteTarget.record.code}.`
          : deleteTarget.kind === 'assignment'
            ? `Affectation supprimee : ${deleteTarget.record.employee}.`
            : deleteTarget.kind === 'goal'
              ? `Objectif supprime : ${deleteTarget.record.title}.`
              : `Check-in supprime : ${deleteTarget.record.title}.`,
      );
      setReloadKey((value) => value + 1);
      closeDeleteModal();
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer cet element.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const kpiRowActions = (row, kind) => {
    const items = [
      {
        id: `${kind}-view-${row.id}`,
        label: 'Voir le detail',
        icon: Eye,
        onClick: () => setSelectedDetail({ kind, record: row }),
      },
    ];

    if (kind === 'definition') {
      items.push(
        {
          id: `${kind}-edit-${row.id}`,
          label: 'Modifier',
          icon: Pencil,
          onClick: () => openEditKpiSheet(row),
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

    if (kind === 'assignment') {
      items.push(
        {
          id: `${kind}-edit-${row.id}`,
          label: 'Modifier',
          icon: Pencil,
          onClick: () => openEditAssignmentSheet(row),
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

    if (kind === 'goal') {
      items.push(
        {
          id: `${kind}-edit-${row.id}`,
          label: 'Modifier',
          icon: Pencil,
          onClick: () => openEditGoalSheet(row),
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

    if (kind === 'checkin') {
      items.push(
        {
          id: `${kind}-edit-${row.id}`,
          label: 'Modifier',
          icon: Pencil,
          onClick: () => openEditCheckInSheet(row),
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

    return (
      <DropdownAction
        label={<EllipsisVertical size={18} strokeWidth={1.5} />}
        buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
        items={items}
      />
    );
  };

  const definitionColumns = [
    { header: 'Code', accessor: 'code' },
    { header: 'KPI', accessor: 'name' },
    { header: 'Scope', accessor: 'scope' },
    {
      header: 'Mesure',
      render: (row) => `${row.metricType} ${row.unit ? `(${row.unit})` : ''}`.trim(),
    },
    {
      header: 'Poids defaut',
      render: (row) => `${row.defaultWeight}%`,
    },
    { header: 'Proprietaire', accessor: 'owner' },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const assignmentColumns = [
    { header: 'Collaborateur', accessor: 'employee' },
    { header: 'Direction', accessor: 'direction' },
    { header: 'Manager', accessor: 'manager' },
    {
      header: 'Portefeuille',
      render: (row) => `${row.assignedKpis} KPI / ${row.totalWeight}%`,
    },
    {
      header: 'Completion',
      render: (row) => (
        <div className="min-w-[140px] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Execution</span>
            <span>{row.completion}%</span>
          </div>
          <div className="h-2 rounded-full bg-background">
            <div
              className={['h-full rounded-full', normalize(row.riskLevel) === 'high' ? 'bg-rose-500' : normalize(row.riskLevel) === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'].join(' ')}
              style={{ width: `${row.completion}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Risque',
      render: (row) => <RiskBadge value={row.riskLevel} />,
    },
  ];

  const goalColumns = [
    { header: 'Collaborateur', accessor: 'employee' },
    { header: 'Objectif', accessor: 'title' },
    {
      header: 'Cible',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm text-text">{row.targetValue}</p>
          <p className="text-xs text-muted">Realise : {row.achievedValue}</p>
        </div>
      ),
    },
    {
      header: 'Poids',
      render: (row) => `${row.weight}%`,
    },
    {
      header: 'Progression',
      render: (row) => (
        <div className="min-w-[150px] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Avancement</span>
            <span>{row.progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-background">
            <div
              className={['h-full rounded-full', normalize(row.status) === 'at risk' ? 'bg-rose-500' : normalize(row.status) === 'on hold' ? 'bg-amber-500' : 'bg-primary'].join(' ')}
              style={{ width: `${row.progressPercent}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const checkInColumns = [
    { header: 'Collaborateur', accessor: 'employee' },
    { header: 'Check-in', accessor: 'title' },
    { header: 'Objectif', accessor: 'goalTitle' },
    {
      header: 'Progression',
      render: (row) => `${row.progressPercent}%`,
    },
    { header: 'Date', accessor: 'checkInDate' },
    {
      header: 'Statut',
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
  ];

  const renderOverview = () => (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="KPI actifs"
          value={dashboard.summary.activeKpis}
          subtitle="Definitions actuellement utilisables"
          accent="bg-primary/10 text-primary"
          Icon={Gauge}
        />
        <SummaryCard
          title="Objectifs a risque"
          value={dashboard.summary.atRiskGoals}
          subtitle="Items en retard, bloques ou sous seuil"
          accent="bg-rose-500/10 text-rose-600"
          Icon={ShieldAlert}
        />
        <SummaryCard
          title="Completion moyenne"
          value={`${dashboard.summary.averageCompletion}%`}
          subtitle="Execution moyenne des portefeuilles KPI"
          accent="bg-emerald-500/10 text-emerald-600"
          Icon={Target}
        />
        <SummaryCard
          title="Check-ins finalises"
          value={dashboard.summary.completedCheckIns}
          subtitle="Revues de mi-parcours deja renseignees"
          accent="bg-sky-500/10 text-sky-600"
          Icon={ClipboardList}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card
          title="Pilotage execution KPI"
          subtitle="Lecture rapide du portefeuille d objectifs"
        >
          <div className="space-y-5">
            <MetricBar label="Completion moyenne" value={dashboard.summary.averageCompletion} toneClass="bg-primary" />
            <MetricBar
              label="Part de KPI a risque"
              value={goals.length ? Math.round((dashboard.summary.atRiskGoals / goals.length) * 100) : 0}
              toneClass="bg-rose-500"
            />
            <MetricBar
              label="Check-ins completes"
              value={checkIns.length ? Math.round((dashboard.summary.completedCheckIns / checkIns.length) * 100) : 0}
              toneClass="bg-emerald-500"
            />
          </div>
        </Card>

        <Card
          title="Direction la plus avancee"
          subtitle="Meilleure moyenne d execution selon les filtres"
        >
          {dashboard.summary.topDirection ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background px-4 py-4">
                <p className="text-sm text-muted">Direction</p>
                <p className="mt-1 text-xl font-semibold text-text">{dashboard.summary.topDirection.direction}</p>
                <p className="mt-2 text-sm text-text">{dashboard.summary.topDirection.insight}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">Score moyen</p>
                  <p className="mt-1 text-lg font-semibold text-text">{dashboard.summary.topDirection.scoreAverage}</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">Completion</p>
                  <p className="mt-1 text-lg font-semibold text-text">{dashboard.summary.topDirection.completionRate}%</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Aucune donnee analytique disponible.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card title="Top KPI a suivre" subtitle="Definitions les plus critiques de la campagne visible">
          <div className="space-y-3">
            {definitions.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDetail({ kind: 'definition', record: item })}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-secondary/50"
              >
                <div>
                  <p className="font-medium text-text">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-text">{item.scope}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Portefeuilles exposes" subtitle="Collaborateurs avec execution la plus fragile">
          <div className="space-y-3">
            {assignments
              .slice()
              .sort((a, b) => a.completion - b.completion)
              .slice(0, 4)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedDetail({ kind: 'assignment', record: item })}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-medium text-text">{item.employee}</p>
                    <p className="mt-1 text-sm text-muted">{item.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-text">{item.completion}%</p>
                    <RiskBadge value={item.riskLevel} />
                  </div>
                </button>
              ))}
          </div>
        </Card>
      </section>
    </div>
  );

  const renderCatalog = () => (
    <DataTable
      title="Catalogue KPI"
      description="Bibliotheque des indicateurs utilisables par scope et par direction."
      columns={definitionColumns}
      data={definitions}
      emptyMessage="Aucun KPI avec ces filtres"
      onDeleteSelected={(rows) => handleBulkDelete(rows, 'definition')}
      deleteConfirmConfig={{
        title: 'Supprimer les KPI',
        description: (rows) => `Voulez-vous vraiment supprimer ${formatCountLabel(rows.length, 'ce KPI', 'ces KPI')} ?`,
        confirmLabel: 'Supprimer',
      }}
      renderActions={(row) => kpiRowActions(row, 'definition')}
    />
  );

  const renderAssignments = () => (
    <DataTable
      title="Affectations KPI"
      description="Portefeuilles d indicateurs attribues aux collaborateurs."
      columns={assignmentColumns}
      data={assignments}
      emptyMessage="Aucune affectation avec ces filtres"
      onDeleteSelected={(rows) => handleBulkDelete(rows, 'assignment')}
      deleteConfirmConfig={{
        title: 'Supprimer les affectations',
        description: (rows) => `Voulez-vous vraiment supprimer ${formatCountLabel(rows.length, 'cette affectation', 'ces affectations')} ?`,
        confirmLabel: 'Supprimer',
      }}
      renderActions={(row) => kpiRowActions(row, 'assignment')}
    />
  );

  const renderGoals = () => (
    <DataTable
      title="Objectifs individuels"
      description="Suivi des objectifs SMART, cibles, poids et realisations."
      columns={goalColumns}
      data={goals}
      emptyMessage="Aucun objectif avec ces filtres"
      onDeleteSelected={(rows) => handleBulkDelete(rows, 'goal')}
      deleteConfirmConfig={{
        title: 'Supprimer les objectifs',
        description: (rows) => `Voulez-vous vraiment supprimer ${formatCountLabel(rows.length, 'cet objectif', 'ces objectifs')} ?`,
        confirmLabel: 'Supprimer',
      }}
      renderActions={(row) => kpiRowActions(row, 'goal')}
    />
  );

  const renderCheckIns = () => (
    <DataTable
      title="Check-ins et revues mi-parcours"
      description="Suivi des points d avancement, blockers et actions decidees."
      columns={checkInColumns}
      data={checkIns}
      emptyMessage="Aucun check-in avec ces filtres"
      onDeleteSelected={(rows) => handleBulkDelete(rows, 'checkin')}
      deleteConfirmConfig={{
        title: 'Supprimer les check-ins',
        description: (rows) => `Voulez-vous vraiment supprimer ${formatCountLabel(rows.length, 'ce check-in', 'ces check-ins')} ?`,
        confirmLabel: 'Supprimer',
      }}
      renderActions={(row) => kpiRowActions(row, 'checkin')}
    />
  );

  const renderAnalytics = () => (
    <div className="grid gap-4 xl:grid-cols-2">
      {dashboard.analytics.map((item) => (
        <Card
          key={item.id}
          title={item.direction}
          subtitle={item.insight}
          action={<RiskBadge value={item.atRiskCount >= 3 ? 'High' : item.atRiskCount >= 2 ? 'Medium' : 'Low'} />}
        >
          <div className="space-y-4">
            <MetricBar label="Score moyen" value={item.scoreAverage} toneClass="bg-primary" />
            <MetricBar label="Taux de completion" value={item.completionRate} toneClass="bg-emerald-500" />
            <MetricBar label="Part top band" value={item.topBandShare} toneClass="bg-sky-500" />
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-sm text-muted">KPI a risque</p>
              <p className="mt-1 text-2xl font-semibold text-text">{item.atRiskCount}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderSheetContent = () => {
    if (!selectedDetail) {
      return null;
    }

    const { kind, record } = selectedDetail;

    if (kind === 'definition') {
      return (
        <div className="space-y-5">
          <DetailRow label="Code" value={record.code} />
          <DetailRow label="Scope" value={record.scope} />
          <DetailRow label="Type de mesure" value={`${record.metricType} ${record.unit ? `(${record.unit})` : ''}`.trim()} />
          <DetailRow label="Poids par defaut" value={`${record.defaultWeight}%`} />
          <DetailRow label="Proprietaire" value={record.owner} />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Description</h4>
            <p className="text-sm leading-6 text-muted">{record.description}</p>
          </div>
        </div>
      );
    }

    if (kind === 'assignment') {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} label={record.status} />
            <RiskBadge value={record.riskLevel} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">{record.completion}% de completion</span>
          </div>
          <DetailRow label="Collaborateur" value={record.employee} />
          <DetailRow label="Manager" value={record.manager} />
          <DetailRow label="Portefeuille" value={`${record.assignedKpis} KPI / ${record.totalWeight}%`} />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Synthese</h4>
            <p className="text-sm leading-6 text-muted">{record.summary}</p>
          </div>
        </div>
      );
    }

    if (kind === 'goal') {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} label={record.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">{record.progressPercent}%</span>
          </div>
          <DetailRow label="KPI" value={record.kpiCode} />
          <DetailRow label="Collaborateur" value={record.employee} />
          <DetailRow label="Cible" value={record.targetValue} />
          <DetailRow label="Realise" value={record.achievedValue} />
          <DetailRow label="Poids" value={`${record.weight}%`} />
          <DetailRow label="Echeance" value={record.dueDate} />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Commentaire</h4>
            <p className="text-sm leading-6 text-muted">{record.note}</p>
          </div>
        </div>
      );
    }

    if (kind === 'checkin') {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} label={record.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-text">{record.progressPercent}%</span>
          </div>
          <DetailRow label="Collaborateur" value={record.employee} />
          <DetailRow label="Objectif" value={record.goalTitle} />
          <DetailRow label="Date" value={record.checkInDate} />
          <DetailRow label="Support necessaire" value={record.supportNeeded} />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Blocker</h4>
            <p className="text-sm leading-6 text-muted">{record.blocker}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text">Actions suivantes</h4>
            <p className="text-sm leading-6 text-muted">{record.nextActions}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderActionSheetContent = () => {
    const actionType = typeof actionSheet === 'string' ? actionSheet : actionSheet?.type;

    if (actionType === 'createKpi' || actionType === 'editKpi') {
      return (
        <form id="create-kpi-definition-form" className="space-y-4" onSubmit={actionType === 'createKpi' ? handleCreateKpi : handleUpdateKpi}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Code KPI"
              value={kpiForm.code}
              onChange={(event) => setKpiForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="OPS-SLA-07"
            />
            <Input
              label="Nom de l indicateur"
              value={kpiForm.name}
              onChange={(event) => setKpiForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Taux de resolution SLA"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Scope"
              value={kpiForm.scope}
              onChange={(value) => setKpiForm((current) => ({ ...current, scope: String(value) }))}
              options={KPI_SCOPE_OPTIONS}
            />
            <DropdownSelect
              label="Type de mesure"
              value={kpiForm.metricType}
              onChange={(value) => setKpiForm((current) => ({ ...current, metricType: String(value) }))}
              options={KPI_METRIC_OPTIONS}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Direction"
              value={kpiForm.directionName}
              onChange={(value) => setKpiForm((current) => ({ ...current, directionName: String(value) }))}
              options={filterOptions.directions.filter((option) => option.value !== 'all')}
              renderOptionLabel={(option) => option.label}
            />
            <DropdownSelect
              label="Manager"
              value={kpiForm.managerEmployeeId}
              onChange={(value) => setKpiForm((current) => ({ ...current, managerEmployeeId: String(value) }))}
              options={employeeOptions}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Unite"
              value={kpiForm.unit}
              onChange={(event) => setKpiForm((current) => ({ ...current, unit: event.target.value }))}
              placeholder="%"
            />
            <Input
              label="Poids par defaut"
              type="number"
              min="0"
              max="100"
              value={kpiForm.defaultWeight}
              onChange={(event) => setKpiForm((current) => ({ ...current, defaultWeight: event.target.value }))}
              placeholder="15"
            />
            <DropdownSelect
              label="Statut"
              value={kpiForm.status}
              onChange={(value) => setKpiForm((current) => ({ ...current, status: String(value) }))}
              options={KPI_STATUS_OPTIONS}
            />
          </div>

          <Input
            label="Owner"
            value={kpiForm.ownerLabel}
            onChange={(event) => setKpiForm((current) => ({ ...current, ownerLabel: event.target.value }))}
            placeholder="Direction Operations"
          />

          <TextAreaField
            label="Description"
            value={kpiForm.description}
            onChange={(value) => setKpiForm((current) => ({ ...current, description: value }))}
            placeholder="Definition, mode de calcul et finalite metier."
          />
        </form>
      );
    }

    if (actionType === 'assignKpis' || actionType === 'editAssignment') {
      return (
        <form id="assign-kpi-workflow-form" className="space-y-4" onSubmit={actionType === 'assignKpis' ? handleAssignmentWorkflow : handleUpdateAssignment}>
          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Collaborateur"
              value={assignmentForm.employeeId}
              onChange={(value) => setAssignmentForm((current) => ({ ...current, employeeId: String(value) }))}
              options={employeeOptions}
            />
            <DropdownSelect
              label="Cycle"
              value={assignmentForm.cycleId}
              onChange={(value) => setAssignmentForm((current) => ({ ...current, cycleId: String(value) }))}
              options={filterOptions.cycles.filter((option) => option.value !== 'all')}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Manager"
              value={assignmentForm.managerEmployeeId}
              onChange={(value) => setAssignmentForm((current) => ({ ...current, managerEmployeeId: String(value) }))}
              options={employeeOptions}
            />
            <DropdownSelect
              label="KPI principal"
              value={assignmentForm.kpiDefinitionId}
              onChange={(value) => setAssignmentForm((current) => ({ ...current, kpiDefinitionId: String(value) }))}
              options={kpiDefinitionOptions}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Nombre de KPI"
              type="number"
              min="1"
              value={assignmentForm.assignedKpis}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, assignedKpis: event.target.value }))}
            />
            <Input
              label="Poids total"
              type="number"
              min="1"
              max="100"
              value={assignmentForm.totalWeight}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, totalWeight: event.target.value }))}
            />
            <DropdownSelect
              label="Risque initial"
              value={assignmentForm.riskLevel}
              onChange={(value) => setAssignmentForm((current) => ({ ...current, riskLevel: String(value) }))}
              options={ASSIGNMENT_RISK_OPTIONS}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Progression initiale"
              type="number"
              min="0"
              max="100"
              value={assignmentForm.completionPercent}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, completionPercent: event.target.value }))}
            />
            <Input
              label="Echeance"
              type="date"
              value={assignmentForm.dueDate}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </div>

          <Input
            label="Objectif principal"
            value={assignmentForm.goalTitle}
            onChange={(event) => setAssignmentForm((current) => ({ ...current, goalTitle: event.target.value }))}
            placeholder="Maintenir un SLA agence superieur a 92 %"
          />

          <div className="grid gap-4 md:grid-cols-1">
            <Input
              label="Cible"
              value={assignmentForm.targetValue}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, targetValue: event.target.value }))}
              placeholder="92 %"
            />
          </div>

          <TextAreaField
            label="Synthese portefeuille"
            value={assignmentForm.summary}
            onChange={(value) => setAssignmentForm((current) => ({ ...current, summary: value }))}
            placeholder="Contexte, enjeux et priorites de l affectation."
            rows={3}
          />

          <TextAreaField
            label="Note objectif"
            value={assignmentForm.goalNote}
            onChange={(value) => setAssignmentForm((current) => ({ ...current, goalNote: value }))}
            placeholder="Commentaire de cadrage pour le premier objectif."
            rows={3}
          />
        </form>
      );
    }

    if (actionType === 'createGoal' || actionType === 'editGoal') {
      return (
        <form id="create-performance-goal-form" className="space-y-4" onSubmit={actionType === 'createGoal' ? handleCreateGoal : handleUpdateGoal}>
          <DropdownSelect
            label="Collaborateur"
            value={goalForm.employeeId}
            onChange={(value) => setGoalForm((current) => ({ ...current, employeeId: String(value) }))}
            options={employeeOptions}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <DropdownSelect
              label="Cycle"
              value={goalForm.cycleId}
              onChange={(value) => setGoalForm((current) => ({ ...current, cycleId: String(value) }))}
              options={filterOptions.cycles.filter((option) => option.value !== 'all')}
            />
            <DropdownSelect
              label="KPI"
              value={goalForm.kpiDefinitionId}
              onChange={(value) => setGoalForm((current) => ({ ...current, kpiDefinitionId: String(value) }))}
              options={kpiDefinitionOptions}
            />
          </div>
          <Input
            label="Titre objectif"
            value={goalForm.title}
            onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Maintenir un SLA agence superieur a 92 %"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Cible"
              value={goalForm.targetValue}
              onChange={(event) => setGoalForm((current) => ({ ...current, targetValue: event.target.value }))}
              placeholder="92 %"
            />
            <Input
              label="Realise"
              value={goalForm.achievedValue}
              onChange={(event) => setGoalForm((current) => ({ ...current, achievedValue: event.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Progression"
              type="number"
              min="0"
              max="100"
              value={goalForm.progressPercent}
              onChange={(event) => setGoalForm((current) => ({ ...current, progressPercent: event.target.value }))}
            />
            <Input
              label="Poids"
              type="number"
              min="0"
              max="100"
              value={goalForm.weight}
              onChange={(event) => setGoalForm((current) => ({ ...current, weight: event.target.value }))}
            />
            <Input
              label="Echeance"
              type="date"
              value={goalForm.dueDate}
              onChange={(event) => setGoalForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </div>
          <TextAreaField
            label="Note"
            value={goalForm.note}
            onChange={(value) => setGoalForm((current) => ({ ...current, note: value }))}
            placeholder="Commentaire de cadrage."
          />
          <DropdownSelect
            label="Statut"
            value={goalForm.status}
            onChange={(value) => setGoalForm((current) => ({ ...current, status: String(value) }))}
            options={[
              { value: 'NOT_STARTED', label: 'Non demarre' },
              { value: 'IN_PROGRESS', label: 'En cours' },
              { value: 'COMPLETED', label: 'Termine' },
              { value: 'ON_HOLD', label: 'En attente' },
              { value: 'CANCELLED', label: 'Annule' },
            ]}
          />
        </form>
      );
    }

    if (actionType === 'createCheckIn' || actionType === 'editCheckIn') {
      return (
        <form id="create-kpi-checkin-form" className="space-y-4" onSubmit={actionType === 'createCheckIn' ? handleCreateCheckIn : handleUpdateCheckIn}>
          <DropdownSelect
            label="Objectif"
            value={checkInForm.goalId}
            onChange={(value) => setCheckInForm((current) => ({ ...current, goalId: String(value) }))}
            options={goalOptions}
          />
          <Input
            label="Titre"
            value={checkInForm.title}
            onChange={(event) => setCheckInForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Revue mensuelle SLA agence"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={checkInForm.checkInDate}
              onChange={(event) => setCheckInForm((current) => ({ ...current, checkInDate: event.target.value }))}
            />
            <Input
              label="Progression"
              type="number"
              min="0"
              max="100"
              value={checkInForm.progressPercent}
              onChange={(event) => setCheckInForm((current) => ({ ...current, progressPercent: event.target.value }))}
            />
          </div>
          <DropdownSelect
            label="Statut"
            value={checkInForm.status}
            onChange={(value) => setCheckInForm((current) => ({ ...current, status: String(value) }))}
            options={CHECKIN_STATUS_OPTIONS}
          />
          <TextAreaField
            label="Blocker"
            value={checkInForm.blocker}
            onChange={(value) => setCheckInForm((current) => ({ ...current, blocker: value }))}
            placeholder="Dette technique, surcharge..."
            rows={3}
          />
          <TextAreaField
            label="Support necessaire"
            value={checkInForm.supportNeeded}
            onChange={(value) => setCheckInForm((current) => ({ ...current, supportNeeded: value }))}
            placeholder="Renfort, arbitrage, budget..."
            rows={3}
          />
          <TextAreaField
            label="Actions suivantes"
            value={checkInForm.nextActions}
            onChange={(value) => setCheckInForm((current) => ({ ...current, nextActions: value }))}
            placeholder="Plan d action decide."
            rows={3}
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
          (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createKpi' || (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editKpi' ? 'create-kpi-definition-form'
            : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'assignKpis' || (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editAssignment' ? 'assign-kpi-workflow-form'
              : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createGoal' || (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editGoal' ? 'create-performance-goal-form'
                : 'create-kpi-checkin-form'
        }
        disabled={isSubmittingAction}
      >
        {isSubmittingAction
          ? 'Enregistrement...'
          : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createKpi'
            ? 'Creer le KPI'
            : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editKpi'
              ? 'Mettre a jour le KPI'
            : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'assignKpis'
              ? 'Affecter le portefeuille'
              : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editAssignment'
                ? 'Mettre a jour l affectation'
              : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'createGoal'
                ? 'Creer l objectif'
                : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editGoal'
                  ? 'Mettre a jour l objectif'
                : (typeof actionSheet === 'string' ? actionSheet : actionSheet?.type) === 'editCheckIn'
                  ? 'Mettre a jour le check-in'
                  : 'Creer le check-in'}
      </Button>
    </div>
  );

  const actionSheetMeta = {
    createKpi: {
      title: 'Creer un KPI',
      description: 'Definis un nouvel indicateur reutilisable dans le catalogue.',
    },
    editKpi: {
      title: 'Modifier un KPI',
      description: 'Ajuste la definition, le scope et le poids par defaut de l indicateur.',
    },
    assignKpis: {
      title: 'Affecter un portefeuille KPI',
      description: 'Associe un portefeuille d indicateurs et un objectif principal a un collaborateur.',
    },
    editAssignment: {
      title: 'Modifier une affectation KPI',
      description: 'Mets a jour le portefeuille, le risque et la progression de l affectation.',
    },
    createGoal: {
      title: 'Creer un objectif individuel',
      description: 'Rattache un objectif SMART a une campagne et, si besoin, a un KPI du catalogue.',
    },
    editGoal: {
      title: 'Modifier un objectif individuel',
      description: 'Ajuste la cible, la progression, le poids et le statut de l objectif.',
    },
    createCheckIn: {
      title: 'Creer un check-in',
      description: 'Planifie un point de suivi avec blockers, support attendu et actions suivantes.',
    },
    editCheckIn: {
      title: 'Modifier un check-in',
      description: 'Mets a jour la progression, les blockers et les actions du point de suivi.',
    },
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'KPI board', href: '/Kpiboard' },
          { label: TABS.find((item) => item.id === activeTab)?.label || 'Vue d ensemble' },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text">KPI board</h2>
          <p className="text-sm text-muted">
            Structure les indicateurs, suit les objectifs SMART et pilote les check-ins de performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(activeTab === 'overview' || activeTab === 'catalog') ? (
            <Button type="button" variant="secondary" onClick={openCreateKpiSheet}>
              <Target size={16} />
              Creer un KPI
            </Button>
          ) : null}
          {(activeTab === 'overview' || activeTab === 'assignments') ? (
            <Button type="button" onClick={openMassAssignmentSheet}>
              <Sparkles size={16} />
              Affecter en masse
            </Button>
          ) : null}
          {activeTab === 'goals' ? (
            <Button type="button" onClick={openCreateGoalSheet}>
              <Target size={16} />
              Creer un objectif
            </Button>
          ) : null}
          {activeTab === 'checkins' ? (
            <Button type="button" onClick={openCreateCheckInSheet}>
              <ClipboardList size={16} />
              Creer un check-in
            </Button>
          ) : null}
        </div>
      </div>

      <Card contentClassName="p-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un KPI, un collaborateur ou un check-in..."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <DropdownSelect
            value={selectedCycle}
            onChange={(value) => setSelectedCycle(String(value))}
            options={filterOptions.cycles}
            buttonClassName="bg-background"
          />

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
        </div>
      </Card>

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

      {isLoading ? (
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

      {!isLoading && activeTab === 'overview' ? renderOverview() : null}
      {!isLoading && activeTab === 'catalog' ? renderCatalog() : null}
      {!isLoading && activeTab === 'assignments' ? renderAssignments() : null}
      {!isLoading && activeTab === 'goals' ? renderGoals() : null}
      {!isLoading && activeTab === 'checkins' ? renderCheckIns() : null}
      {!isLoading && activeTab === 'analytics' ? renderAnalytics() : null}

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
          selectedDetail?.kind === 'definition' ? selectedDetail?.record?.name
            : selectedDetail?.kind === 'assignment' ? `Affectation - ${selectedDetail?.record?.employee}`
              : selectedDetail?.kind === 'goal' ? selectedDetail?.record?.title
                : selectedDetail?.kind === 'checkin' ? selectedDetail?.record?.title
                  : 'Detail'
        }
        description={
          selectedDetail?.kind === 'definition' ? 'Definition detaillee de l indicateur.'
            : selectedDetail?.kind === 'assignment' ? 'Lecture du portefeuille KPI du collaborateur.'
              : selectedDetail?.kind === 'goal' ? 'Detail de l objectif individuel et de son execution.'
                : selectedDetail?.kind === 'checkin' ? 'Compte rendu du point de suivi.'
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
        description="Voulez-vous vraiment supprimer cet element KPI ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={isSubmittingAction}
      />
    </div>
  );
}

export default Kpiboard;
