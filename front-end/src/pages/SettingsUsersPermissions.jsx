import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, Mail, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { Button, Card, DataTable, DropdownSelect, Input, StatusBadge, useToast } from '../components/ui';
import useAuthStore from '../stores/authStore';
import {
  createAdminUser,
  getAccessOptions,
  listAdminUsers,
  updateAdminUserAccess,
  updateAdminUserStatus,
} from '../services/adminApi';

const PAGE_SIZE = 10;

const INITIAL_CREATE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  roleCode: '',
  preferredChannel: 'EMAIL',
  permissionCodes: [],
  moduleCodes: [],
};

const INITIAL_ACCESS_FORM = {
  roleCode: '',
  permissionCodes: [],
  moduleCodes: [],
};

function CheckboxGroup({ options, values, onToggle, emptyMessage }) {
  if (!options.length) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const checked = values.includes(option.code);

        return (
          <label
            key={option.code}
            className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text transition hover:border-primary/40"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option.code)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            />
            <span className="min-w-0">
              <span className="block font-medium">{option.name}</span>
              <span className="block text-xs text-muted">{option.code}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'INVITED':
      return 'Invite';
    case 'ACTIVE':
      return 'Actif';
    case 'SUSPENDED':
      return 'Suspendu';
    case 'ARCHIVED':
      return 'Archive';
    case 'LOCKED':
      return 'Verrouille';
    default:
      return status || 'N/A';
  }
}

function SettingsUsersPermissions() {
  const toast = useToast();
  const authUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [accessOptions, setAccessOptions] = useState({
    roles: [],
    permissions: [],
    modules: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [accessForm, setAccessForm] = useState(INITIAL_ACCESS_FORM);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId],
  );

  const userRows = useMemo(() => users.map((user) => ({
    ...user,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur',
    roleLabel: user.access?.role?.name || user.access?.role?.code || '-',
    modulesLabel: (user.access?.modules || []).join(', ') || '-',
    permissionsCount: user.access?.permissions?.length || 0,
  })), [users]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const data = await getAccessOptions();
        if (cancelled) return;

        setAccessOptions({
          roles: data.roles || [],
          permissions: data.permissions || [],
          modules: data.modules || [],
        });
        setCreateForm((prev) => ({
          ...prev,
          roleCode: prev.roleCode || data.roles?.[0]?.code || '',
        }));
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger les options d acces.');
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        setIsLoading(true);
        const data = await listAdminUsers({ page, limit: PAGE_SIZE });
        if (cancelled) return;

        const nextUsers = data.users || [];
        setUsers(nextUsers);
        setPagination(data.pagination || null);

        setSelectedUserId((currentId) => {
          if (currentId && nextUsers.some((user) => user.id === currentId)) {
            return currentId;
          }
          return nextUsers[0]?.id || '';
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger les utilisateurs.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [page, toast]);

  useEffect(() => {
    if (!selectedUser) {
      setAccessForm(INITIAL_ACCESS_FORM);
      return;
    }

    setAccessForm({
      roleCode: selectedUser.access?.role?.code || accessOptions.roles?.[0]?.code || '',
      permissionCodes: selectedUser.access?.permissions || [],
      moduleCodes: selectedUser.access?.modules || [],
    });
  }, [selectedUser, accessOptions.roles]);

  const columns = useMemo(() => ([
    {
      header: 'Utilisateur',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.fullName}</p>
          <p className="text-xs text-muted">{row.email || row.phone || '-'}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'roleLabel',
    },
    {
      header: 'Statut',
      accessor: 'status',
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={getStatusLabel(row.status)}
          size="sm"
        />
      ),
    },
    {
      header: 'Permissions',
      accessor: 'permissionsCount',
      render: (row) => `${row.permissionsCount} autorisation(s)`,
    },
    {
      header: 'Derniere connexion',
      accessor: 'lastLoginAt',
      render: (row) => formatDateTime(row.lastLoginAt),
    },
  ]), []);

  function toggleFormCode(field, code) {
    setCreateForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(code)
        ? prev[field].filter((item) => item !== code)
        : [...prev[field], code],
    }));
  }

  function toggleAccessCode(field, code) {
    setAccessForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(code)
        ? prev[field].filter((item) => item !== code)
        : [...prev[field], code],
    }));
  }

  async function refreshUsers(targetPage = page) {
    const data = await listAdminUsers({ page: targetPage, limit: PAGE_SIZE });
    setUsers(data.users || []);
    setPagination(data.pagination || null);
    return data.users || [];
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    try {
      setIsSubmittingCreate(true);
      const result = await createAdminUser(createForm);
      toast.success(result.message || 'Utilisateur cree avec succes.');

      if (result.temporaryPassword) {
        toast.info(`Mot de passe temporaire: ${result.temporaryPassword}`, {
          duration: 7000,
        });
      }

      setCreateForm({
        ...INITIAL_CREATE_FORM,
        roleCode: accessOptions.roles?.[0]?.code || '',
      });

      setPage(1);
      const nextUsers = await refreshUsers(1);
      if (result.user?.id) {
        setSelectedUserId(result.user.id);
      } else {
        setSelectedUserId(nextUsers[0]?.id || '');
      }
    } catch (error) {
      toast.error(error.message || 'Creation utilisateur impossible.');
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function handleSaveAccess(event) {
    event.preventDefault();

    if (!selectedUser) {
      toast.error('Selectionne un utilisateur avant de modifier ses acces.');
      return;
    }

    try {
      setIsSubmittingAccess(true);
      const result = await updateAdminUserAccess(selectedUser.id, accessForm);
      toast.success(result.message || 'Acces utilisateur mis a jour.');
      await refreshUsers(page);
      setSelectedUserId(selectedUser.id);
    } catch (error) {
      toast.error(error.message || 'Mise a jour des acces impossible.');
    } finally {
      setIsSubmittingAccess(false);
    }
  }

  async function handleToggleStatus(user) {
    const nextStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    try {
      const result = await updateAdminUserStatus(user.id, { status: nextStatus });
      toast.success(result.message || 'Statut utilisateur mis a jour.');
      await refreshUsers(page);
    } catch (error) {
      toast.error(error.message || 'Modification du statut impossible.');
    }
  }

  return (
    <div className="space-y-4">
      <Card
        title="Utilisateurs et permissions"
        subtitle="Creez des comptes, attribuez un role, des permissions directes et les modules accessibles selon votre tenant."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Tenant courant</p>
            <p className="mt-2 text-lg font-semibold text-text">{authUser?.tenant?.name || 'Tenant principal'}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Utilisateurs charges</p>
            <p className="mt-2 text-lg font-semibold text-text">{pagination?.totalItems || users.length || 0}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Roles disponibles</p>
            <p className="mt-2 text-lg font-semibold text-text">{accessOptions.roles.length}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card
          title="Liste des utilisateurs"
          subtitle="Selectionnez un utilisateur pour ajuster ses autorisations ou suspendre son acces."
        >
          <DataTable
            title=""
            description=""
            columns={columns}
            data={userRows}
            emptyMessage={isLoading ? 'Chargement des utilisateurs...' : 'Aucun utilisateur disponible.'}
            renderActions={(row) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedUserId === row.id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedUserId(row.id)}
                >
                  Gérer
                </Button>
                <Button
                  variant={row.status === 'SUSPENDED' ? 'secondary' : 'danger'}
                  size="sm"
                  onClick={() => handleToggleStatus(row)}
                >
                  {row.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}
                </Button>
              </div>
            )}
            pagination={{
              page: pagination?.page || page,
              totalPages: pagination?.totalPages || 1,
              label: pagination
                ? `${pagination.page}-${pagination.totalPages} pages`
                : '1 page',
              onPrev: () => setPage((prev) => Math.max(1, prev - 1)),
              onNext: () => setPage((prev) => Math.min(pagination?.totalPages || 1, prev + 1)),
              onPageChange: (nextPage) => setPage(nextPage),
              disablePrev: (pagination?.page || page) <= 1,
              disableNext: (pagination?.page || page) >= (pagination?.totalPages || 1),
            }}
          />
        </Card>

        <div className="space-y-4">
          <Card
            title="Créer un utilisateur"
            subtitle="Le backend génère un mot de passe temporaire et envoie les identifiants via le canal choisi."
          >
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  id="user-first-name"
                  name="firstName"
                  label="Prenom"
                  value={createForm.firstName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  placeholder="Ex: Alice"
                  required
                  leftIcon={UserRound}
                />
                <Input
                  id="user-last-name"
                  name="lastName"
                  label="Nom"
                  value={createForm.lastName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Ex: Kasongo"
                  required
                  leftIcon={UserRound}
                />
                <Input
                  id="user-email"
                  name="email"
                  label="Email"
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="alice@entreprise.com"
                  leftIcon={Mail}
                />
                <Input
                  id="user-phone"
                  name="phone"
                  label="Telephone"
                  value={createForm.phone}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+243..."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DropdownSelect
                  id="create-role"
                  label="Role"
                  value={createForm.roleCode}
                  onChange={(nextValue) => setCreateForm((prev) => ({ ...prev, roleCode: nextValue }))}
                  options={accessOptions.roles.map((role) => ({
                    value: role.code,
                    label: role.name,
                  }))}
                />

                <DropdownSelect
                  id="create-channel"
                  label="Canal prefere"
                  value={createForm.preferredChannel}
                  onChange={(nextValue) => setCreateForm((prev) => ({ ...prev, preferredChannel: nextValue }))}
                  options={[
                    { value: 'EMAIL', label: 'Email' },
                    { value: 'SMS', label: 'SMS' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" />
                  <h4 className="text-sm font-semibold text-text">Permissions directes</h4>
                </div>
                <CheckboxGroup
                  options={accessOptions.permissions}
                  values={createForm.permissionCodes}
                  onToggle={(code) => toggleFormCode('permissionCodes', code)}
                  emptyMessage="Aucune permission disponible."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-primary" />
                  <h4 className="text-sm font-semibold text-text">Modules accessibles</h4>
                </div>
                <CheckboxGroup
                  options={accessOptions.modules}
                  values={createForm.moduleCodes}
                  onToggle={(code) => toggleFormCode('moduleCodes', code)}
                  emptyMessage="Aucun module disponible."
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmittingCreate}>
                  <UserPlus size={16} />
                  {isSubmittingCreate ? 'Création...' : 'Créer l’utilisateur'}
                </Button>
              </div>
            </form>
          </Card>

          <Card
            title="Autorisations utilisateur"
            subtitle={selectedUser
              ? `Modifiez les acces de ${selectedUser.firstName} ${selectedUser.lastName}.`
              : 'Selectionnez un utilisateur dans la liste pour modifier ses acces.'}
          >
            {selectedUser ? (
              <form className="space-y-4" onSubmit={handleSaveAccess}>
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-text">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                      <p className="text-sm text-muted">{selectedUser.email || selectedUser.phone || '-'}</p>
                    </div>
                    <StatusBadge status={selectedUser.status} label={getStatusLabel(selectedUser.status)} />
                  </div>
                </div>

                <DropdownSelect
                  id="selected-role"
                  label="Role attribué"
                  value={accessForm.roleCode}
                  onChange={(nextValue) => setAccessForm((prev) => ({ ...prev, roleCode: nextValue }))}
                  options={accessOptions.roles.map((role) => ({
                    value: role.code,
                    label: role.name,
                  }))}
                />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-text">Permissions</h4>
                  <CheckboxGroup
                    options={accessOptions.permissions}
                    values={accessForm.permissionCodes}
                    onToggle={(code) => toggleAccessCode('permissionCodes', code)}
                    emptyMessage="Aucune permission disponible."
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-text">Modules</h4>
                  <CheckboxGroup
                    options={accessOptions.modules}
                    values={accessForm.moduleCodes}
                    onToggle={(code) => toggleAccessCode('moduleCodes', code)}
                    emptyMessage="Aucun module disponible."
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingAccess}>
                    {isSubmittingAccess ? 'Enregistrement...' : 'Enregistrer les accès'}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted">Aucun utilisateur sélectionné.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SettingsUsersPermissions;
