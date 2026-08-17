import React, { useEffect, useMemo, useState } from 'react';
import { Building2, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  ConfirmModal,
  DropdownSelect,
  Input,
  Sheet,
  useToast,
} from '../components/ui';
import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from '../services/adminApi';
import { listEmployees } from '../services/employeesApi';

const INITIAL_FORM = {
  id: '',
  code: '',
  name: '',
  description: '',
  parentId: '',
  managerEmployeeId: '',
};

function SettingsDepartments() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [departmentPayload, employeePayload] = await Promise.all([
        listDepartments(),
        listEmployees({ limit: 500 }),
      ]);

      setDepartments(departmentPayload.departments || []);
      setEmployees(employeePayload.items || []);
    } catch (error) {
      toast.error(error.message || 'Impossible de charger les départements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parentOptions = useMemo(
    () => [
      { value: '', label: 'Aucun parent' },
      ...departments
        .filter((department) => department.id !== form.id)
        .map((department) => ({ value: department.id, label: department.name })),
    ],
    [departments, form.id],
  );

  const managerOptions = useMemo(
    () => [
      { value: '', label: 'Aucun responsable' },
      ...employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName} — ${employee.employeeNumber}`,
      })),
    ],
    [employees],
  );

  const filteredDepartments = useMemo(() => {
    const normalized = String(search || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    return departments.filter((department) => {
      if (!normalized) {
        return true;
      }

      return [
        department.code,
        department.name,
        department.description,
        department.parent?.name,
      ].join(' ').toLowerCase().includes(normalized);
    });
  }, [departments, search]);

  const totalEmployees = departments.reduce((total, department) => total + (department.counts?.employees || 0), 0);
  const rootDepartments = departments.filter((department) => !department.parentId).length;

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setSheetOpen(true);
  };

  const openEdit = (department) => {
    setForm({
      id: department.id,
      code: department.code || '',
      name: department.name || '',
      description: department.description || '',
      parentId: department.parentId || '',
      managerEmployeeId: department.managerEmployeeId || '',
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      code: form.code || '',
      name: form.name || '',
      description: form.description || '',
      parentId: form.parentId || null,
      managerEmployeeId: form.managerEmployeeId || null,
    };

    try {
      if (form.id) {
        await updateDepartment(form.id, payload);
        toast.success('Département mis à jour.');
      } else {
        await createDepartment(payload);
        toast.success('Département créé. Le dossier RH a été généré automatiquement.');
      }

      setSheetOpen(false);
      setForm(INITIAL_FORM);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Impossible d’enregistrer le département.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      await deleteDepartment(confirmDeleteId);
      toast.success('Département supprimé.');
      setConfirmDeleteId('');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer le département.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-text">Départements</h3>
          <p className="text-sm text-muted">
            Créez et structurez les départements. Chaque nouveau département crée son dossier RH automatiquement.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nouveau département
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card contentClassName="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Départements</p>
          <p className="mt-2 text-2xl font-semibold text-text">{departments.length}</p>
        </Card>
        <Card contentClassName="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Racines</p>
          <p className="mt-2 text-2xl font-semibold text-text">{rootDepartments}</p>
        </Card>
        <Card contentClassName="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Employés rattachés</p>
          <p className="mt-2 text-2xl font-semibold text-text">{totalEmployees}</p>
        </Card>
      </section>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un département..."
            leftIcon={Search}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={openCreate}>
              <Plus size={16} />
              Ajouter
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card contentClassName="p-6">
          <p className="text-sm text-muted">Chargement des départements...</p>
        </Card>
      ) : filteredDepartments.length === 0 ? (
        <Card contentClassName="p-6">
          <p className="text-sm text-muted">Aucun département trouvé.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredDepartments.map((department) => (
            <Card
              key={department.id}
              title={department.name}
              subtitle={`${department.code} · ${department.counts?.employees || 0} employé(s) · ${department.counts?.children || 0} sous-département(s)`}
              action={(
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(department)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(department.id)}>
                    <Trash2 size={14} />
                    Supprimer
                  </Button>
                </div>
              )}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  <Building2 size={14} />
                  <span>Dossier RH: {department.code}</span>
                </div>
                {department.description ? (
                  <p className="text-sm text-text-secondary">{department.description}</p>
                ) : null}
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Parent</p>
                    <p className="mt-1 text-sm text-text">{department.parent?.name || 'Aucun'}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Responsable</p>
                    <p className="mt-1 text-sm text-text">
                      {department.manager?.fullName || 'Aucun'}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-border bg-background p-3 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={14} />
                    <span>Le sous-dossier employé est créé lors de la création ou de l’upload du dossier.</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={form.id ? 'Modifier le département' : 'Nouveau département'}
        description="Les dossiers RH et la structure de sous-dossiers suivent le code du département."
        footer={(
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{form.id ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <Input
            label="Code"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="rh, finance, it..."
          />
          <Input
            label="Nom"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ressources humaines"
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Brève description du département"
          />
          <DropdownSelect
            label="Parent"
            value={form.parentId}
            onChange={(value) => setForm((current) => ({ ...current, parentId: value }))}
            options={parentOptions}
          />
          <DropdownSelect
            label="Responsable"
            value={form.managerEmployeeId}
            onChange={(value) => setForm((current) => ({ ...current, managerEmployeeId: value }))}
            options={managerOptions}
          />
        </div>
      </Sheet>

      <ConfirmModal
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId('')}
        onConfirm={handleDelete}
        title="Supprimer le département"
        description="La suppression retire le département de la configuration des dossiers RH."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
      />
    </div>
  );
}

export default SettingsDepartments;
