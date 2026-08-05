import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Hash,
  Lock,
  Paperclip,
  Plus,
  Target,
  UserRound,
} from 'lucide-react';
import { Button, Card, ConfirmModal, DropdownSelect, Input, Sheet, useToast } from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import {
  createPipelineStep,
  createScorecardCriterion,
  createWeeklyPlan,
  deletePipelineStep,
  deleteScorecardCriterion,
  deleteWeeklyPlan,
  getRecruitmentPlanning,
  updatePipelineStep,
  updateScorecardCriterion,
  updateWeeklyPlan,
} from '../services/recruitmentPlanningApi';

const WEEKLY_STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planifie' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Termine' },
  { value: 'BLOCKED', label: 'Bloque' },
  { value: 'CANCELLED', label: 'Annule' },
];

const CREATE_MENU_ITEMS = [
  { id: 'weekly', label: 'Planning hebdomadaire' },
  { id: 'pipeline', label: 'Pipeline recrutement' },
  { id: 'scorecard', label: 'Scorecard recrutement' },
];

const PLANNING_TABS = [
  { to: '/Recruitment/Planification/Planning-Hebdomadaire', label: 'Planning hebdomadaire' },
  { to: '/Recruitment/Planification/Pipeline-Recrutement', label: 'Pipeline recrutement' },
  { to: '/Recruitment/Planification/Scorecard-Recrutement', label: 'Scorecard recrutement' },
  { to: '/Recruitment/Planification/Historique-Modifications', label: 'Historique des modifications' },
];

const EMPTY_WEEKLY_FORM = {
  weekLabel: '',
  objective: '',
  keyActions: '',
  ownerLabel: '',
  deliverable: '',
  kpiTarget: '',
  status: 'PLANNED',
  orderIndex: '',
};

const EMPTY_PIPELINE_FORM = {
  stepName: '',
  entryCriteria: '',
  exitCriteria: '',
  ownerLabel: '',
  slaDays: '',
  orderIndex: '',
  isActive: true,
};

const EMPTY_SCORECARD_FORM = {
  criterion: '',
  weight: '',
  notes: '',
  orderIndex: '',
  isActive: true,
};

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Oui' },
  { value: 'false', label: 'Non' },
];

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function statusTone(value) {
  if (value === 'DONE') return 'success';
  if (value === 'IN_PROGRESS') return 'info';
  if (value === 'BLOCKED') return 'danger';
  if (value === 'CANCELLED') return 'warning';
  return 'neutral';
}

function statusLabel(value) {
  return WEEKLY_STATUS_OPTIONS.find((item) => item.value === value)?.label || value;
}

function normalizeWeeklyPayload(form) {
  return {
    weekLabel: String(form.weekLabel || '').trim(),
    objective: String(form.objective || '').trim(),
    keyActions: String(form.keyActions || '').trim(),
    ownerLabel: String(form.ownerLabel || '').trim(),
    deliverable: String(form.deliverable || '').trim(),
    kpiTarget: String(form.kpiTarget || '').trim(),
    status: form.status,
    orderIndex: form.orderIndex === '' ? undefined : Number(form.orderIndex),
  };
}

function normalizePipelinePayload(form) {
  return {
    stepName: String(form.stepName || '').trim(),
    entryCriteria: String(form.entryCriteria || '').trim(),
    exitCriteria: String(form.exitCriteria || '').trim(),
    ownerLabel: String(form.ownerLabel || '').trim(),
    slaDays: Number(form.slaDays),
    orderIndex: form.orderIndex === '' ? undefined : Number(form.orderIndex),
    isActive: Boolean(form.isActive),
  };
}

function normalizeScorecardPayload(form) {
  return {
    criterion: String(form.criterion || '').trim(),
    weight: Number(form.weight),
    notes: String(form.notes || '').trim(),
    orderIndex: form.orderIndex === '' ? undefined : Number(form.orderIndex),
    isActive: Boolean(form.isActive),
  };
}

function WeeklyMetaRow({ icon: Icon, label, children }) {
  return (
    <div className="grid gap-2 py-2.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <Icon size={16} className="text-muted" />
        <span>{label}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function WeeklySection({ title, hint, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function RecruitmentPlanning() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [scorecardCriteria, setScorecardCriteria] = useState([]);
  const [history, setHistory] = useState([]);

  const [weeklyForm, setWeeklyForm] = useState(EMPTY_WEEKLY_FORM);
  const [pipelineForm, setPipelineForm] = useState(EMPTY_PIPELINE_FORM);
  const [scorecardForm, setScorecardForm] = useState(EMPTY_SCORECARD_FORM);

  const [editingWeeklyId, setEditingWeeklyId] = useState(null);
  const [editingPipelineId, setEditingPipelineId] = useState(null);
  const [editingScorecardId, setEditingScorecardId] = useState(null);

  const [deleteState, setDeleteState] = useState({
    open: false,
    type: '',
    id: '',
    label: '',
  });
  const [formModalType, setFormModalType] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const summary = useMemo(
    () => ({
      weeklyPlansCount: weeklyPlans.length,
      pipelineStepsCount: pipelineSteps.length,
      scorecardCriteriaCount: scorecardCriteria.length,
      totalWeight: scorecardCriteria.reduce((sum, item) => sum + Number(item.weight || 0), 0),
    }),
    [weeklyPlans, pipelineSteps, scorecardCriteria],
  );

  const loadPlanning = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getRecruitmentPlanning();
      setWeeklyPlans(data.weeklyPlans || []);
      setPipelineSteps(data.pipelineSteps || []);
      setScorecardCriteria(data.scorecardCriteria || []);
      setHistory(data.history || []);
    } catch (error) {
      toast.error(error.message || 'Impossible de charger la planification.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanning();
  }, []);

  const resetEditingState = () => {
    setEditingWeeklyId(null);
    setEditingPipelineId(null);
    setEditingScorecardId(null);
  };

  const closeFormModal = () => {
    if (!saving) {
      setIsFormModalOpen(false);
      setFormModalType('');
      resetEditingState();
    }
  };

  const openCreateModal = (type) => {
    resetEditingState();
    if (type === 'weekly') setWeeklyForm(EMPTY_WEEKLY_FORM);
    if (type === 'pipeline') setPipelineForm(EMPTY_PIPELINE_FORM);
    if (type === 'scorecard') setScorecardForm(EMPTY_SCORECARD_FORM);
    setFormModalType(type);
    setIsFormModalOpen(true);
  };

  const startEditWeekly = (item) => {
    setEditingWeeklyId(item.id);
    setEditingPipelineId(null);
    setEditingScorecardId(null);
    setWeeklyForm({
      weekLabel: item.weekLabel || '',
      objective: item.objective || '',
      keyActions: item.keyActions || '',
      ownerLabel: item.ownerLabel || '',
      deliverable: item.deliverable || '',
      kpiTarget: item.kpiTarget || '',
      status: item.status || 'PLANNED',
      orderIndex: String(item.orderIndex ?? ''),
    });
    setFormModalType('weekly');
    setIsFormModalOpen(true);
  };

  const startEditPipeline = (item) => {
    setEditingPipelineId(item.id);
    setEditingWeeklyId(null);
    setEditingScorecardId(null);
    setPipelineForm({
      stepName: item.stepName || '',
      entryCriteria: item.entryCriteria || '',
      exitCriteria: item.exitCriteria || '',
      ownerLabel: item.ownerLabel || '',
      slaDays: String(item.slaDays ?? ''),
      orderIndex: String(item.orderIndex ?? ''),
      isActive: Boolean(item.isActive),
    });
    setFormModalType('pipeline');
    setIsFormModalOpen(true);
  };

  const startEditScorecard = (item) => {
    setEditingScorecardId(item.id);
    setEditingWeeklyId(null);
    setEditingPipelineId(null);
    setScorecardForm({
      criterion: item.criterion || '',
      weight: String(item.weight ?? ''),
      notes: item.notes || '',
      orderIndex: String(item.orderIndex ?? ''),
      isActive: Boolean(item.isActive),
    });
    setFormModalType('scorecard');
    setIsFormModalOpen(true);
  };

  const requestDelete = (type, id, label) => {
    setDeleteState({
      open: true,
      type,
      id,
      label,
    });
  };

  const handleWeeklySubmit = async () => {
    try {
      setSaving(true);
      const payload = normalizeWeeklyPayload(weeklyForm);
      if (editingWeeklyId) {
        await updateWeeklyPlan(editingWeeklyId, payload);
        toast.success('Planning hebdomadaire mis a jour.');
      } else {
        await createWeeklyPlan(payload);
        toast.success('Planning hebdomadaire ajoute.');
      }
      setWeeklyForm(EMPTY_WEEKLY_FORM);
      setEditingWeeklyId(null);
      setIsFormModalOpen(false);
      setFormModalType('');
      await loadPlanning(true);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la sauvegarde du planning hebdomadaire.');
    } finally {
      setSaving(false);
    }
  };

  const handlePipelineSubmit = async () => {
    try {
      setSaving(true);
      const payload = normalizePipelinePayload(pipelineForm);
      if (editingPipelineId) {
        await updatePipelineStep(editingPipelineId, payload);
        toast.success('Etape pipeline mise a jour.');
      } else {
        await createPipelineStep(payload);
        toast.success('Etape pipeline ajoutee.');
      }
      setPipelineForm(EMPTY_PIPELINE_FORM);
      setEditingPipelineId(null);
      setIsFormModalOpen(false);
      setFormModalType('');
      await loadPlanning(true);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la sauvegarde de l etape pipeline.');
    } finally {
      setSaving(false);
    }
  };

  const handleScorecardSubmit = async () => {
    try {
      setSaving(true);
      const payload = normalizeScorecardPayload(scorecardForm);
      if (editingScorecardId) {
        await updateScorecardCriterion(editingScorecardId, payload);
        toast.success('Critere scorecard mis a jour.');
      } else {
        await createScorecardCriterion(payload);
        toast.success('Critere scorecard ajoute.');
      }
      setScorecardForm(EMPTY_SCORECARD_FORM);
      setEditingScorecardId(null);
      setIsFormModalOpen(false);
      setFormModalType('');
      await loadPlanning(true);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la sauvegarde du critere scorecard.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteState.id || !deleteState.type) return;

    try {
      setSaving(true);
      if (deleteState.type === 'weekly') await deleteWeeklyPlan(deleteState.id);
      if (deleteState.type === 'pipeline') await deletePipelineStep(deleteState.id);
      if (deleteState.type === 'scorecard') await deleteScorecardCriterion(deleteState.id);
      toast.success('Element supprime avec succes.');
      setDeleteState({ open: false, type: '', id: '', label: '' });
      await loadPlanning(true);
    } catch (error) {
      toast.error(error.message || 'Suppression impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (formModalType === 'weekly') {
      await handleWeeklySubmit();
      return;
    }
    if (formModalType === 'pipeline') {
      await handlePipelineSubmit();
      return;
    }
    if (formModalType === 'scorecard') {
      await handleScorecardSubmit();
    }
  };

  const modalTitle = useMemo(() => {
    if (formModalType === 'weekly') {
      return editingWeeklyId ? 'Modifier planning hebdomadaire' : 'Nouveau planning hebdomadaire';
    }
    if (formModalType === 'pipeline') {
      return editingPipelineId ? 'Modifier etape pipeline' : 'Nouvelle etape pipeline';
    }
    if (formModalType === 'scorecard') {
      return editingScorecardId ? 'Modifier critere scorecard' : 'Nouveau critere scorecard';
    }
    return 'Creation';
  }, [formModalType, editingWeeklyId, editingPipelineId, editingScorecardId]);

  const isWeeklySheet = formModalType === 'weekly';
  const isPipelineSheet = formModalType === 'pipeline';
  const isScorecardSheet = formModalType === 'scorecard';
  const isPlanningDetailSheet = isWeeklySheet || isPipelineSheet || isScorecardSheet;
  const submitLabel = useMemo(() => {
    if (formModalType === 'weekly') return editingWeeklyId ? 'Mettre a jour' : 'Enregistrer';
    if (formModalType === 'pipeline') return editingPipelineId ? 'Mettre a jour' : 'Enregistrer';
    if (formModalType === 'scorecard') return editingScorecardId ? 'Mettre a jour' : 'Enregistrer';
    return 'Enregistrer';
  }, [editingPipelineId, editingScorecardId, editingWeeklyId, formModalType]);
  const weeklyFieldClassName = [
    'w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-text placeholder:text-muted outline-none transition',
    'focus:border-primary focus:ring-2 focus:ring-ring/20',
  ].join(' ');

  return (
    <div className="space-y-4">
      <Card
        title="Planification recrutement"
        subtitle="Planifiez vos semaines, votre pipeline et votre scorecard directement dans l'application."
        action={(
          <DropdownAction
            label={(
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Creer
              </span>
            )}
            items={CREATE_MENU_ITEMS}
            onSelect={(item) => openCreateModal(item.id)}
            buttonClassName="bg-primary text-on-primary hover:bg-primary/90 dark:bg-primary dark:text-on-primary dark:hover:bg-primary/90"
            menuClassName="min-w-[240px]"
          />
        )}
      >
        <div className="flex w-full gap-3">
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-text-secondary">Plannings hebdo</p>
            <p className="text-lg font-semibold text-text-primary">{summary.weeklyPlansCount}</p>
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-text-secondary">Etapes pipeline</p>
            <p className="text-lg font-semibold text-text-primary">{summary.pipelineStepsCount}</p>
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-text-secondary">Criteres scorecard</p>
            <p className="text-lg font-semibold text-text-primary">{summary.scorecardCriteriaCount}</p>
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-text-secondary">Poids total</p>
            <p className="text-lg font-semibold text-text-primary">{summary.totalWeight.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card contentClassName="p-2">
        <nav className="flex flex-wrap gap-2">
          {PLANNING_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => [
                'rounded-md px-3 py-2 text-sm font-medium transition',
                isActive ? 'bg-primary text-on-primary' : 'bg-background text-text hover:bg-secondary',
              ].join(' ')}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </Card>

      <Outlet
        context={{
          loading,
          weeklyPlans,
          pipelineSteps,
          scorecardCriteria,
          history,
          startEditWeekly,
          startEditPipeline,
          startEditScorecard,
          requestDelete,
          statusTone,
          statusLabel,
          formatDateTime,
        }}
      />

      <Sheet
        open={isFormModalOpen}
        onClose={closeFormModal}
        title={isPlanningDetailSheet ? null : modalTitle}
        description="Renseignez les informations puis enregistrez pour mettre à jour la planification."
        size="lg"
        className={isPlanningDetailSheet ? 'max-w-[820px]' : ''}
        headerClassName={isPlanningDetailSheet ? 'hidden' : ''}
        contentClassName={isPlanningDetailSheet ? 'bg-surface px-0 py-0' : ''}
      >
        <form className={isPlanningDetailSheet ? 'flex min-h-full flex-col' : 'space-y-4'} onSubmit={handleFormSubmit}>
          {formModalType === 'weekly' ? (
            <>
              <div className="border-b border-border bg-surface px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setWeeklyForm((previous) => ({ ...previous, status: 'DONE' }))}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text transition hover:border-primary/40 hover:bg-secondary"
                  >
                    <CheckCircle2 size={16} />
                    <span>Marquer comme terminee</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                      aria-label="Membres"
                    >
                      KB
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text transition hover:border-primary/40 hover:bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Partager</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-border bg-background/70 px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Lock size={14} />
                    <span>Cette tache n est visible que par les membres de ce projet.</span>
                  </div>
                  <button type="button" className="font-medium text-text hover:text-primary">
                    Rendre public
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-8 px-6 py-7">
                <div className="space-y-8">
                  <div className="space-y-5">
                    <input
                      type="text"
                      value={weeklyForm.weekLabel}
                      onChange={(e) => setWeeklyForm((p) => ({ ...p, weekLabel: e.target.value }))}
                      placeholder="Tache 1"
                      className="w-full border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight text-text placeholder:text-muted outline-none"
                    />

                    <div className="space-y-2">
                      <WeeklyMetaRow icon={UserRound} label="Responsable">
                        <Input
                          value={weeklyForm.ownerLabel}
                          onChange={(e) => setWeeklyForm((p) => ({ ...p, ownerLabel: e.target.value }))}
                          placeholder="Aucun responsable"
                          className="max-w-none"
                          inputClassName="border-0 bg-transparent px-0 py-1 text-text placeholder:text-muted focus:border-transparent focus:ring-0"
                        />
                      </WeeklyMetaRow>

                      <WeeklyMetaRow icon={CalendarDays} label="Statut">
                        <div className="max-w-[220px]">
                          <DropdownSelect
                            value={weeklyForm.status}
                            onChange={(nextValue) => setWeeklyForm((p) => ({ ...p, status: nextValue }))}
                            options={WEEKLY_STATUS_OPTIONS.map((item) => ({
                              value: item.value,
                              label: item.label,
                            }))}
                            buttonClassName="border-0 bg-transparent px-0 py-1 text-text shadow-none hover:border-transparent"
                          />
                        </div>
                      </WeeklyMetaRow>

                      <WeeklyMetaRow icon={Hash} label="Ordre">
                        <Input
                          type="number"
                          min="0"
                          value={weeklyForm.orderIndex}
                          onChange={(e) => setWeeklyForm((p) => ({ ...p, orderIndex: e.target.value }))}
                          placeholder="Aucun ordre"
                          inputClassName="border-0 bg-transparent px-0 py-1 text-text placeholder:text-muted focus:border-transparent focus:ring-0"
                        />
                      </WeeklyMetaRow>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-semibold text-text">
                      <span>Projets</span>
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs text-text-secondary">1</span>
                      <button type="button" className="text-text-secondary transition hover:text-primary" aria-label="Ajouter un projet">
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="border-b border-border pb-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-text-primary">
                        <span className="inline-flex h-3 w-3 rounded-sm bg-primary/60" />
                        <span>Planning recrutement - Hebdomadaire</span>
                        <div className="inline-flex items-center gap-1 text-text-secondary">
                          <span>{statusLabel(weeklyForm.status)}</span>
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <WeeklySection title="Description" hint="En quoi consiste cette tache ?">
                  <textarea
                    value={weeklyForm.objective}
                    onChange={(e) => setWeeklyForm((p) => ({ ...p, objective: e.target.value }))}
                    placeholder="En quoi consiste cette tache ?"
                    rows={5}
                    className={weeklyFieldClassName}
                  />
                </WeeklySection>

                <WeeklySection title="Sous-taches" hint="Liste ici les actions cles a realiser cette semaine.">
                  <div className="space-y-3">
                    <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-text hover:text-primary">
                      <Plus size={16} />
                      <span>Ajouter</span>
                    </button>
                    <textarea
                      value={weeklyForm.keyActions}
                      onChange={(e) => setWeeklyForm((p) => ({ ...p, keyActions: e.target.value }))}
                      placeholder="Type to add a subtask..."
                      rows={4}
                      className={weeklyFieldClassName}
                    />
                  </div>
                </WeeklySection>

                <WeeklySection title="Pieces jointes" hint="Utilise ce bloc pour noter le livrable attendu ou les pieces a fournir.">
                  <div className="space-y-3">
                    <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-text hover:text-primary">
                      <Plus size={16} />
                      <span>Ajouter</span>
                    </button>
                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
                        <Paperclip size={16} className="text-muted" />
                        <span>Livrable</span>
                      </div>
                      <textarea
                        value={weeklyForm.deliverable}
                        onChange={(e) => setWeeklyForm((p) => ({ ...p, deliverable: e.target.value }))}
                        placeholder="Precise le document, le support ou le resultat concret attendu."
                        rows={4}
                        className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm text-text placeholder:text-muted outline-none"
                      />
                    </div>
                  </div>
                </WeeklySection>

                <WeeklySection title="KPI cible" hint="Quel indicateur permet de juger la reussite de cette semaine ?">
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
                      <Target size={16} className="text-muted" />
                      <span>Mesure de succes</span>
                    </div>
                    <textarea
                      value={weeklyForm.kpiTarget}
                      onChange={(e) => setWeeklyForm((p) => ({ ...p, kpiTarget: e.target.value }))}
                      placeholder="Ex: 10 candidatures qualifiees, validation du brief, entretiens planifies..."
                      rows={4}
                      className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm text-text placeholder:text-muted outline-none"
                    />
                  </div>
                </WeeklySection>

                <WeeklySection title="Commentaire" hint="Zone libre pour ajouter une note rapide sur la preparation de la semaine.">
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      KB
                    </div>
                    <textarea
                      placeholder="Ajouter un commentaire"
                      rows={3}
                      className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm text-text placeholder:text-muted outline-none"
                    />
                  </div>
                </WeeklySection>
              </div>

              <div className="sticky bottom-0 border-t border-border bg-surface/95 px-6 py-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <FileText size={16} />
                    <span>Planning hebdomadaire</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={closeFormModal} disabled={saving}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {formModalType === 'pipeline' ? (
            <>
              <div className="border-b border-border bg-surface px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPipelineForm((previous) => ({ ...previous, isActive: !previous.isActive }))}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text transition hover:border-primary/40 hover:bg-secondary"
                  >
                    <CheckCircle2 size={16} />
                    <span>{pipelineForm.isActive ? 'Marquer comme inactive' : 'Marquer comme active'}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                      aria-label="Membres"
                    >
                      KB
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text transition hover:border-primary/40 hover:bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Partager</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-border bg-background/70 px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Lock size={14} />
                    <span>Cette etape n est visible que par les membres de ce projet.</span>
                  </div>
                  <button type="button" className="font-medium text-text hover:text-primary">
                    Rendre public
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-8 px-6 py-7">
                <div className="space-y-8">
                  <div className="space-y-5">
                    <input
                      type="text"
                      value={pipelineForm.stepName}
                      onChange={(e) => setPipelineForm((p) => ({ ...p, stepName: e.target.value }))}
                      placeholder="Prequalification RH"
                      className="w-full border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight text-text placeholder:text-muted outline-none"
                    />

                    <div className="space-y-2">
                      <WeeklyMetaRow icon={UserRound} label="Responsable">
                        <Input
                          value={pipelineForm.ownerLabel}
                          onChange={(e) => setPipelineForm((p) => ({ ...p, ownerLabel: e.target.value }))}
                          placeholder="Aucun responsable"
                          className="max-w-none"
                          inputClassName="border-0 bg-transparent px-0 py-1 text-text placeholder:text-muted focus:border-transparent focus:ring-0"
                        />
                      </WeeklyMetaRow>

                      <WeeklyMetaRow icon={CalendarDays} label="SLA (jours)">
                        <Input
                          type="number"
                          min="1"
                          value={pipelineForm.slaDays}
                          onChange={(e) => setPipelineForm((p) => ({ ...p, slaDays: e.target.value }))}
                          placeholder="Aucun delai"
                          inputClassName="border-0 bg-transparent px-0 py-1 text-text placeholder:text-muted focus:border-transparent focus:ring-0"
                        />
                      </WeeklyMetaRow>

                      <WeeklyMetaRow icon={Hash} label="Ordre">
                        <Input
                          type="number"
                          min="0"
                          value={pipelineForm.orderIndex}
                          onChange={(e) => setPipelineForm((p) => ({ ...p, orderIndex: e.target.value }))}
                          placeholder="Aucun ordre"
                          inputClassName="border-0 bg-transparent px-0 py-1 text-text placeholder:text-muted focus:border-transparent focus:ring-0"
                        />
                      </WeeklyMetaRow>

                      <WeeklyMetaRow icon={CheckCircle2} label="Actif">
                        <div className="max-w-[220px]">
                          <DropdownSelect
                            value={pipelineForm.isActive ? 'true' : 'false'}
                            onChange={(nextValue) => setPipelineForm((p) => ({ ...p, isActive: nextValue === 'true' }))}
                            options={ACTIVE_OPTIONS}
                            buttonClassName="border-0 bg-transparent px-0 py-1 text-text shadow-none hover:border-transparent"
                          />
                        </div>
                      </WeeklyMetaRow>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-semibold text-text">
                      <span>Projets</span>
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs text-text-secondary">1</span>
                      <button type="button" className="text-text-secondary transition hover:text-primary" aria-label="Ajouter un projet">
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="border-b border-border pb-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-text-primary">
                        <span className="inline-flex h-3 w-3 rounded-sm bg-primary/60" />
                        <span>Pipeline recrutement</span>
                        <div className="inline-flex items-center gap-1 text-text-secondary">
                          <span>{pipelineForm.isActive ? 'Actif' : 'Inactif'}</span>
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <WeeklySection title="Critere d entree" hint="Que faut-il verifier avant de faire entrer un candidat dans cette etape ?">
                  <textarea
                    value={pipelineForm.entryCriteria}
                    onChange={(e) => setPipelineForm((p) => ({ ...p, entryCriteria: e.target.value }))}
                    placeholder="Definis les conditions d entree de cette etape."
                    rows={5}
                    className={weeklyFieldClassName}
                  />
                </WeeklySection>

                <WeeklySection title="Critere de sortie" hint="Que faut-il valider pour passer a l etape suivante ?">
                  <textarea
                    value={pipelineForm.exitCriteria}
                    onChange={(e) => setPipelineForm((p) => ({ ...p, exitCriteria: e.target.value }))}
                    placeholder="Definis les conditions de sortie de cette etape."
                    rows={5}
                    className={weeklyFieldClassName}
                  />
                </WeeklySection>

                <WeeklySection title="Commentaire" hint="Zone libre pour documenter l usage de cette etape dans le pipeline.">
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      KB
                    </div>
                    <textarea
                      placeholder="Ajouter un commentaire"
                      rows={3}
                      className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm text-text placeholder:text-muted outline-none"
                    />
                  </div>
                </WeeklySection>
              </div>

              <div className="sticky bottom-0 border-t border-border bg-surface/95 px-6 py-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <FileText size={16} />
                    <span>Pipeline recrutement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={closeFormModal} disabled={saving}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {formModalType === 'scorecard' ? (
            <>
              <div className="border-b border-border bg-surface px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setScorecardForm((previous) => ({ ...previous, isActive: !previous.isActive }))}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text transition hover:border-primary/40 hover:bg-secondary"
                  >
                    <CheckCircle2 size={16} />
                    <span>{scorecardForm.isActive ? 'Marquer comme inactive' : 'Marquer comme active'}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                      aria-label="Membres"
                    >
                      KB
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text transition hover:border-primary/40 hover:bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Partager</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-border bg-background/70 px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Lock size={14} />
                    <span>Ce critere n est visible que par les membres de ce projet.</span>
                  </div>
                  <button type="button" className="font-medium text-text hover:text-primary">
                    Rendre public
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-8 px-6 py-7">
                <div className="space-y-8">
                  <div className="space-y-5">
                    <input
                      type="text"
                      value={scorecardForm.criterion}
                      onChange={(e) => setScorecardForm((p) => ({ ...p, criterion: e.target.value }))}
                      placeholder="Communication"
                      className="w-full border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight text-text placeholder:text-muted outline-none"
                    />

                    <div className="space-y-2">
                      <WeeklyMetaRow icon={Target} label="Poids">
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={scorecardForm.weight}
                          onChange={(e) => setScorecardForm((p) => ({ ...p, weight: e.target.value }))}
                          placeholder="0"
                          inputClassName="border-0 bg-transparent px-0 py-1 text-text placeholder:text-muted focus:border-transparent focus:ring-0"
                        />
                      </WeeklyMetaRow>

                      <WeeklyMetaRow icon={Hash} label="Ordre">
                        <Input
                          type="number"
                          min="0"
                          value={scorecardForm.orderIndex}
                          onChange={(e) => setScorecardForm((p) => ({ ...p, orderIndex: e.target.value }))}
                          placeholder="Aucun ordre"
                          inputClassName="border-0 bg-transparent px-0 py-1 text-text placeholder:text-muted focus:border-transparent focus:ring-0"
                        />
                      </WeeklyMetaRow>

                      <WeeklyMetaRow icon={CheckCircle2} label="Actif">
                        <div className="max-w-[220px]">
                          <DropdownSelect
                            value={scorecardForm.isActive ? 'true' : 'false'}
                            onChange={(nextValue) => setScorecardForm((p) => ({ ...p, isActive: nextValue === 'true' }))}
                            options={ACTIVE_OPTIONS}
                            buttonClassName="border-0 bg-transparent px-0 py-1 text-text shadow-none hover:border-transparent"
                          />
                        </div>
                      </WeeklyMetaRow>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-semibold text-text">
                      <span>Projets</span>
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs text-text-secondary">1</span>
                      <button type="button" className="text-text-secondary transition hover:text-primary" aria-label="Ajouter un projet">
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="border-b border-border pb-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-text-primary">
                        <span className="inline-flex h-3 w-3 rounded-sm bg-primary/60" />
                        <span>Scorecard recrutement</span>
                        <div className="inline-flex items-center gap-1 text-text-secondary">
                          <span>{scorecardForm.isActive ? 'Actif' : 'Inactif'}</span>
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <WeeklySection title="Notes d evaluation" hint="Precise comment ce critere doit etre note pendant les entretiens.">
                  <textarea
                    value={scorecardForm.notes}
                    onChange={(e) => setScorecardForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Ajoute les reperes d evaluation, questions ou attentes pour ce critere."
                    rows={6}
                    className={weeklyFieldClassName}
                  />
                </WeeklySection>

                <WeeklySection title="Vue rapide" hint="Resume visuel du poids de ce critere dans la decision finale.">
                  <div className="rounded-2xl border border-border bg-background/70 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Poids attribue</p>
                        <p className="mt-1 text-sm text-text-secondary">Utilise ce champ pour equilibrer la grille d evaluation.</p>
                      </div>
                      <div className="rounded-2xl bg-primary/10 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-primary">Poids</p>
                        <p className="text-2xl font-semibold text-primary">{scorecardForm.weight || '0'}</p>
                      </div>
                    </div>
                  </div>
                </WeeklySection>

                <WeeklySection title="Commentaire" hint="Zone libre pour ajouter une note rapide sur ce critere.">
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      KB
                    </div>
                    <textarea
                      placeholder="Ajouter un commentaire"
                      rows={3}
                      className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm text-text placeholder:text-muted outline-none"
                    />
                  </div>
                </WeeklySection>
              </div>

              <div className="sticky bottom-0 border-t border-border bg-surface/95 px-6 py-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <FileText size={16} />
                    <span>Scorecard recrutement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={closeFormModal} disabled={saving}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {!isPlanningDetailSheet ? (
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeFormModal} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {submitLabel}
              </Button>
            </div>
          ) : null}
        </form>
      </Sheet>

      <ConfirmModal
        open={deleteState.open}
        onClose={() => setDeleteState({ open: false, type: '', id: '', label: '' })}
        onConfirm={handleConfirmDelete}
        title="Confirmation de suppression"
        description={`Voulez-vous vraiment supprimer "${deleteState.label}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={saving}
      />
    </div>
  );
}

export default RecruitmentPlanning;
