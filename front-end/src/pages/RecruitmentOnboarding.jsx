import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, EllipsisVertical, Plus, Rocket } from 'lucide-react';
import { Button, Card, DataTable, DropdownSelect, Input, Sheet, StatusBadge, useToast } from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import {
  addOnboardingTask,
  createOnboardingPlan,
  listApplications,
  listOnboardingPlans,
  talentStatusTone,
  updateOnboardingTaskStatus,
} from '../services/talentAcquisitionApi';

const PLAN_STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Non demarre' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Termine' },
  { value: 'CANCELLED', label: 'Annule' },
];

const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'A faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Termine' },
  { value: 'BLOCKED', label: 'Bloque' },
];

const EMPTY_PLAN_FORM = {
  applicationId: '',
  status: 'NOT_STARTED',
  startDate: '',
  departmentName: '',
  siteName: '',
  managerName: '',
  notes: '',
};

const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  ownerLabel: '',
  dueDate: '',
  status: 'TODO',
};

function TextAreaField({ label, value, onChange, placeholder, rows = 4 }) {
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

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function RecruitmentOnboarding() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [sheetState, setSheetState] = useState({ open: false, type: '' });
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId],
  );

  const applicationOptions = useMemo(
    () => applications
      .filter((item) => !plans.some((plan) => plan.applicationId === item.id))
      .map((item) => ({
        value: item.id,
        label: `${item.candidate?.firstName || ''} ${item.candidate?.lastName || ''} - ${item.jobPosting?.title || ''}`.trim(),
      })),
    [applications, plans],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        const [plansPayload, applicationsPayload] = await Promise.all([
          listOnboardingPlans(),
          listApplications({ stage: 'HIRED' }),
        ]);

        if (cancelled) return;

        setPlans(plansPayload.items || []);
        setApplications(applicationsPayload.items || []);
        setSelectedPlanId((plansPayload.items || [])[0]?.id || '');
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Impossible de charger l'onboarding.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const planColumns = [
    { header: 'Collaborateur', render: (row) => `${row.application?.candidate?.firstName || ''} ${row.application?.candidate?.lastName || ''}`.trim() || '-' },
    { header: 'Poste', render: (row) => row.application?.jobPosting?.title || '-' },
    { header: 'Departement', accessor: 'departmentName' },
    { header: 'Demarrage', render: (row) => formatDate(row.startDate) },
    { header: 'Statut', render: (row) => <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} /> },
  ];

  const taskColumns = [
    { header: 'Tache', accessor: 'title' },
    { header: 'Owner', accessor: 'ownerLabel' },
    { header: 'Echeance', render: (row) => formatDate(row.dueDate) },
    { header: 'Statut', render: (row) => <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} /> },
  ];

  const closeSheet = () => {
    if (!saving) {
      setSheetState({ open: false, type: '' });
    }
  };

  const openPlanSheet = () => {
    setPlanForm(EMPTY_PLAN_FORM);
    setSheetState({ open: true, type: 'plan' });
  };

  const openTaskSheet = () => {
    if (!selectedPlan) {
      toast.error("Selectionne d'abord un plan d'onboarding.");
      return;
    }
    setTaskForm(EMPTY_TASK_FORM);
    setSheetState({ open: true, type: 'task' });
  };

  const handleCreatePlan = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const created = await createOnboardingPlan(planForm);
      setPlans((current) => [created, ...current]);
      setSelectedPlanId(created.id);
      toast.success("Plan d'onboarding cree.");
      closeSheet();
    } catch (error) {
      toast.error(error.message || "Impossible de creer le plan d'onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!selectedPlan) return;
    try {
      setSaving(true);
      const created = await addOnboardingTask(selectedPlan.id, taskForm);
      setPlans((current) => current.map((plan) => (
        plan.id === selectedPlan.id
          ? { ...plan, tasks: [...(plan.tasks || []), created] }
          : plan
      )));
      toast.success("Tache d'onboarding creee.");
      closeSheet();
    } catch (error) {
      toast.error(error.message || "Impossible de creer la tache.");
    } finally {
      setSaving(false);
    }
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      const updatedTask = await updateOnboardingTaskStatus(taskId, { status });
      setPlans((current) => current.map((plan) => ({
        ...plan,
        tasks: (plan.tasks || []).map((task) => (task.id === taskId ? updatedTask : task)),
      })));
      toast.success('Statut de la tache mis a jour.');
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour la tache.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card contentClassName="p-5"><div className="flex items-center gap-3"><div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Rocket size={22} /></div><div><p className="text-sm text-muted">Plans onboarding</p><p className="text-2xl font-semibold text-text">{plans.length}</p></div></div></Card>
        <Card contentClassName="p-5"><div className="space-y-1"><p className="text-sm text-muted">Plans actifs</p><p className="text-2xl font-semibold text-text">{plans.filter((item) => item.status === 'IN_PROGRESS').length}</p></div></Card>
        <Card contentClassName="p-5"><div className="space-y-1"><p className="text-sm text-muted">Taches ouvertes</p><p className="text-2xl font-semibold text-text">{plans.reduce((sum, plan) => sum + (plan.tasks || []).filter((task) => task.status !== 'DONE').length, 0)}</p></div></Card>
        <Card contentClassName="p-5"><div className="space-y-1"><p className="text-sm text-muted">Candidatures embauchees</p><p className="text-2xl font-semibold text-text">{applications.length}</p></div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={openPlanSheet}><Plus size={16} />Nouveau plan</Button>
        <Button type="button" variant="secondary" onClick={openTaskSheet}><CheckSquare size={16} />Nouvelle tache</Button>
      </div>

      <DataTable
        title="Plans d'integration"
        description={loading ? 'Chargement...' : "Parcours d'arrivee des nouvelles recrues."}
        columns={planColumns}
        data={plans}
        emptyMessage="Aucun plan d'onboarding"
        renderActions={(row) => (
          <DropdownAction
            label={<EllipsisVertical size={18} strokeWidth={1.5} />}
            buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
            items={[{ id: `select-${row.id}`, label: 'Voir les taches', onClick: () => setSelectedPlanId(row.id) }]}
          />
        )}
      />

      <Card
        title={selectedPlan ? `Taches - ${selectedPlan.application?.candidate?.firstName || ''} ${selectedPlan.application?.candidate?.lastName || ''}`.trim() : "Taches d'onboarding"}
        subtitle={selectedPlan ? `${selectedPlan.application?.jobPosting?.title || ''}` : "Selectionne un plan pour voir les taches."}
      >
        <DataTable
          columns={taskColumns}
          data={selectedPlan?.tasks || []}
          emptyMessage="Aucune tache pour ce plan"
          renderActions={(row) => (
            <DropdownAction
              label={<EllipsisVertical size={18} strokeWidth={1.5} />}
              buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
              items={TASK_STATUS_OPTIONS.map((option) => ({
                id: `${row.id}-${option.value}`,
                label: option.label,
                onClick: () => handleTaskStatus(row.id, option.value),
              }))}
            />
          )}
        />
      </Card>

      <Sheet
        open={sheetState.open}
        onClose={closeSheet}
        title={sheetState.type === 'plan' ? "Nouveau plan d'onboarding" : "Nouvelle tache d'onboarding"}
        description={sheetState.type === 'plan' ? "Prepare l'integration du collaborateur retenu." : "Ajoute une tache operationnelle au plan en cours."}
        size="lg"
      >
        {sheetState.type === 'plan' ? (
          <form className="space-y-4" onSubmit={handleCreatePlan}>
            <DropdownSelect label="Candidature embauchee" value={planForm.applicationId} onChange={(value) => setPlanForm((current) => ({ ...current, applicationId: String(value) }))} options={applicationOptions} />
            <div className="grid gap-4 md:grid-cols-2">
              <DropdownSelect label="Statut" value={planForm.status} onChange={(value) => setPlanForm((current) => ({ ...current, status: String(value) }))} options={PLAN_STATUS_OPTIONS} />
              <Input label="Date de demarrage" type="date" value={planForm.startDate} onChange={(event) => setPlanForm((current) => ({ ...current, startDate: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Departement" value={planForm.departmentName} onChange={(event) => setPlanForm((current) => ({ ...current, departmentName: event.target.value }))} />
              <Input label="Site" value={planForm.siteName} onChange={(event) => setPlanForm((current) => ({ ...current, siteName: event.target.value }))} />
              <Input label="Manager" value={planForm.managerName} onChange={(event) => setPlanForm((current) => ({ ...current, managerName: event.target.value }))} />
            </div>
            <TextAreaField label="Notes" value={planForm.notes} onChange={(value) => setPlanForm((current) => ({ ...current, notes: value }))} placeholder="Bienvenue, acces, parcours 30/60/90 jours..." />
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Creer le plan'}</Button></div>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleCreateTask}>
            <Input label="Titre" value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Owner" value={taskForm.ownerLabel} onChange={(event) => setTaskForm((current) => ({ ...current, ownerLabel: event.target.value }))} />
              <Input label="Echeance" type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
            <DropdownSelect label="Statut" value={taskForm.status} onChange={(value) => setTaskForm((current) => ({ ...current, status: String(value) }))} options={TASK_STATUS_OPTIONS} />
            <TextAreaField label="Description" value={taskForm.description} onChange={(value) => setTaskForm((current) => ({ ...current, description: value }))} placeholder="Badge, laptop, induction, contrat, acces..." />
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Creer la tache'}</Button></div>
          </form>
        )}
      </Sheet>
    </div>
  );
}

export default RecruitmentOnboarding;
