import React, { useEffect, useMemo, useState } from 'react';
import { EllipsisVertical, Eye, KeyRound, Mail, ShieldCheck, Trash2, UserCheck, UserPlus, UserRound, UserX } from 'lucide-react';
import { Button, Card, ConfirmModal, DataTable, DropdownSelect, Input, Sheet, StatusBadge, useToast } from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import useAuthStore from '../stores/authStore';
import {
  createAdminUser,
  deleteAdminUser,
  getAccessOptions,
  listAdminUsers,
  updateAdminUserAccess,
  updateAdminUserStatus,
} from '../services/adminApi';

const ADMIN_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function requestAdminJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
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

async function loadAccessOptions() {
  if (typeof getAccessOptions === 'function') {
    return getAccessOptions();
  }

  return requestAdminJson('/api/admin/access/options');
}

const PAGE_SIZE = 10;

const INITIAL_CREATE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  roleCode: '',
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
        const accessCode = option.code || option.key || option.value || '';
        const checked = values.includes(accessCode);
        const description = option.description || option.details || '';

        return (
          <label
            key={accessCode || option.id || option.name}
            className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text transition hover:border-primary/40"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(accessCode)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            />
            <span className="min-w-0">
              {option.name ? <span className="block font-medium">{option.name}</span> : null}
              {description ? <span className="mt-1 block text-xs text-text-secondary">{description}</span> : null}
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
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detailUserId, setDetailUserId] = useState('');
  const [temporaryPasswords, setTemporaryPasswords] = useState({});
  const [userToDelete, setUserToDelete] = useState(null);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [accessForm, setAccessForm] = useState(INITIAL_ACCESS_FORM);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isAccessSheetOpen, setIsAccessSheetOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const detailUser = useMemo(
    () => users.find((user) => user.id === detailUserId) || null,
    [users, detailUserId],
  );

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
        const data = await loadAccessOptions();
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

  function openCreateSheet() {
    setCreateForm({
      ...INITIAL_CREATE_FORM,
      roleCode: accessOptions.roles?.[0]?.code || '',
    });
    setIsCreateSheetOpen(true);
  }

  function openAccessSheet(userId = selectedUserId) {
    if (userId) {
      setSelectedUserId(userId);
    }
    setIsAccessSheetOpen(true);
  }

  function openDetailSheet(userId) {
    setSelectedUserId(userId);
    setDetailUserId(userId);
    setIsDetailSheetOpen(true);
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

      if (result.temporaryPassword && result.user?.id) {
        setTemporaryPasswords((current) => ({
          ...current,
          [result.user.id]: result.temporaryPassword,
        }));
      }

      if (!result.delivery?.sent) {
        toast.error(`Utilisateur cree, mais l email d acces n a pas pu etre envoye${result.delivery?.reason ? ` : ${result.delivery.reason}` : '.'}`);
      }

      setCreateForm({
        ...INITIAL_CREATE_FORM,
        roleCode: accessOptions.roles?.[0]?.code || '',
      });
      setIsCreateSheetOpen(false);

      setPage(1);
      const nextUsers = await refreshUsers(1);
      if (result.user?.id) {
        setSelectedUserId(result.user.id);
        setDetailUserId(result.user.id);
        setIsDetailSheetOpen(true);
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
      setIsAccessSheetOpen(false);
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

  async function handleDeleteUser() {
    if (!userToDelete) return;

    try {
      setIsSubmittingDelete(true);
      const result = await deleteAdminUser(userToDelete.id);
      toast.success(result.message || 'Utilisateur supprime avec succes.');
      setTemporaryPasswords((current) => {
        const next = { ...current };
        delete next[userToDelete.id];
        return next;
      });
      setUserToDelete(null);
      setIsDetailSheetOpen(false);
      const nextUsers = await refreshUsers(page);
      setSelectedUserId(nextUsers[0]?.id || '');
    } catch (error) {
      toast.error(error.message || 'Suppression utilisateur impossible.');
    } finally {
      setIsSubmittingDelete(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card
        title="Utilisateurs et permissions"
        subtitle="Creez des comptes, attribuez un role, des permissions directes et les modules accessibles selon votre tenant."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openCreateSheet}>
              <UserPlus size={16} />
              Créer un utilisateur
            </Button>
            <Button
              variant="primary"
              onClick={() => openAccessSheet()}
              disabled={!selectedUser}
            >
              <ShieldCheck size={16} />
              Modifier les accès
            </Button>
          </div>
        )}
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
              <DropdownAction
                label={<EllipsisVertical size={18} strokeWidth={1.5} />}
                buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
                items={[
                  {
                    id: `detail_${row.id}`,
                    label: 'Voir les details',
                    icon: Eye,
                    onClick: () => openDetailSheet(row.id),
                  },
                  {
                    id: `access_${row.id}`,
                    label: 'Gerer les acces',
                    icon: ShieldCheck,
                    onClick: () => openAccessSheet(row.id),
                  },
                  {
                    id: `status_${row.id}`,
                    label: row.status === 'SUSPENDED' ? 'Reactiver' : 'Suspendre',
                    icon: row.status === 'SUSPENDED' ? UserCheck : UserX,
                    variant: row.status === 'SUSPENDED' ? undefined : 'danger',
                    onClick: () => handleToggleStatus(row),
                  },
                  {
                    id: `delete_${row.id}`,
                    label: 'Supprimer',
                    icon: Trash2,
                    variant: 'danger',
                    disabled: row.id === authUser?.id,
                    onClick: () => setUserToDelete(row),
                  },
                ]}
              />
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

        <Card
          title="Aperçu de l’utilisateur"
          subtitle={selectedUser
            ? `Prévisualisation de ${selectedUser.firstName} ${selectedUser.lastName}.`
            : 'Selectionnez un utilisateur dans la liste pour l’aperçu.'}
          action={(
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openAccessSheet()}
              disabled={!selectedUser}
            >
              Ouvrir le sheet
            </Button>
          )}
        >
          {selectedUser ? (
            <div className="space-y-4">
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Role</p>
                  <p className="mt-2 text-sm font-medium text-text">{selectedUser.access?.role?.name || selectedUser.access?.role?.code || '-'}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Permissions</p>
                  <p className="mt-2 text-sm font-medium text-text">{selectedUser.access?.permissions?.length || 0} autorisation(s)</p>
                </div>
              </div>
              <p className="text-sm text-muted">
                Le formulaire d’édition se trouve maintenant dans un sheet pour garder la liste plus lisible.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Aucun utilisateur sélectionné.</p>
          )}
        </Card>
      </div>

      <Sheet
        open={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        title="Créer un utilisateur"
        description="Le backend génère un mot de passe temporaire et envoie les identifiants via le canal choisi."
        size="lg"
        footer={(
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateSheetOpen(false)} disabled={isSubmittingCreate}>
              Annuler
            </Button>
            <Button type="submit" form="create-user-form" disabled={isSubmittingCreate}>
              <UserPlus size={16} />
              {isSubmittingCreate ? 'Création...' : 'Créer l’utilisateur'}
            </Button>
          </div>
        )}
      >
        <form id="create-user-form" className="space-y-4" onSubmit={handleCreateUser}>
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

            <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
              Les acces seront envoyes par email. Le telephone reste une information de contact.
            </div>
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
        </form>
      </Sheet>

      <Sheet
        open={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        title="Details de l utilisateur"
        description="Informations du compte et acces de connexion."
        size="md"
        footer={detailUser ? (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="danger"
              onClick={() => setUserToDelete(detailUser)}
              disabled={detailUser.id === authUser?.id}
            >
              <Trash2 size={16} />
              Supprimer
            </Button>
            <Button variant="secondary" onClick={() => setIsDetailSheetOpen(false)}>Fermer</Button>
          </div>
        ) : null}
      >
        {detailUser ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-base font-semibold text-text">{detailUser.firstName} {detailUser.lastName}</p>
              <p className="mt-1 text-sm text-muted">{detailUser.email || detailUser.phone || '-'}</p>
              <div className="mt-3"><StatusBadge status={detailUser.status} label={getStatusLabel(detailUser.status)} /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Role</p>
                <p className="mt-2 text-sm font-medium text-text">{detailUser.access?.role?.name || detailUser.access?.role?.code || '-'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Modules</p>
                <p className="mt-2 text-sm font-medium text-text">{(detailUser.access?.modules || []).join(', ') || '-'}</p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Mot de passe temporaire</p>
              {temporaryPasswords[detailUser.id] ? (
                <p className="mt-2 break-all font-mono text-base font-semibold text-text">{temporaryPasswords[detailUser.id]}</p>
              ) : (
                <p className="mt-2 text-sm text-muted">Non disponible : le mot de passe n est jamais conserve en clair. Il est visible ici uniquement juste apres la creation du compte.</p>
              )}
            </div>
          </div>
        ) : <p className="text-sm text-muted">Utilisateur introuvable.</p>}
      </Sheet>

      <ConfirmModal
        open={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Supprimer cet utilisateur ?"
        description={userToDelete ? `Le compte de ${userToDelete.firstName} ${userToDelete.lastName} sera supprime definitivement.` : ''}
        confirmLabel="Supprimer"
        loading={isSubmittingDelete}
      />

      <Sheet
        open={isAccessSheetOpen}
        onClose={() => setIsAccessSheetOpen(false)}
        title="Modifier les accès"
        description={selectedUser
          ? `Ajustez les permissions de ${selectedUser.firstName} ${selectedUser.lastName}.`
          : 'Sélectionnez un utilisateur pour continuer.'}
        size="lg"
        footer={(
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAccessSheetOpen(false)} disabled={isSubmittingAccess}>
              Annuler
            </Button>
            <Button type="submit" form="access-user-form" disabled={isSubmittingAccess || !selectedUser}>
              {isSubmittingAccess ? 'Enregistrement...' : 'Enregistrer les accès'}
            </Button>
          </div>
        )}
      >
        {selectedUser ? (
          <form id="access-user-form" className="space-y-4" onSubmit={handleSaveAccess}>
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
          </form>
        ) : (
          <p className="text-sm text-muted">Aucun utilisateur sélectionné.</p>
        )}
      </Sheet>
    </div>
  );
}

export default SettingsUsersPermissions;
