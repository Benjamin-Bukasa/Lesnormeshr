import React, { useEffect, useMemo, useState } from 'react';
import { Eye, FilePlus2, XCircle } from 'lucide-react';
import {
  Button,
  Card,
  DataTable,
  DropdownSelect,
  Input,
  Sheet,
  StatusBadge,
  useToast,
} from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import { getLeaveFilterOptions, getLeaveRequests } from '../services/leaveApi';
import {
  formatDate,
  formatUnits,
  getLeaveStatusLabel,
  getLeaveStatusTone,
  normalizeSearchValue,
} from './leaveHelpers';

const INITIAL_FORM = {
  leaveTypeCode: 'annual',
  startDate: '',
  endDate: '',
  reason: '',
  contactPhone: '',
};

function LeaveMyRequests() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ statuses: [], leaveTypes: [] });
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formValues, setFormValues] = useState(INITIAL_FORM);

  useEffect(() => {
    let active = true;

    Promise.all([getLeaveRequests(), getLeaveFilterOptions()]).then(([requestData, options]) => {
      if (!active) return;
      setRequests(requestData);
      setFilterOptions(options);
    });

    return () => {
      active = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchTarget = normalizeSearchValue([
        request.reference,
        request.employee,
        request.leaveType,
        request.reason,
      ].join(' '));

      if (statusFilter !== 'all' && request.status !== statusFilter) return false;
      if (leaveTypeFilter !== 'all' && request.leaveTypeCode !== leaveTypeFilter) return false;
      if (searchValue && !searchTarget.includes(normalizeSearchValue(searchValue))) return false;
      return true;
    });
  }, [leaveTypeFilter, requests, searchValue, statusFilter]);

  const columns = [
    {
      header: 'Référence',
      accessor: 'reference',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.reference}</p>
          <p className="text-xs text-muted">{row.leaveType}</p>
        </div>
      ),
    },
    {
      header: 'Période',
      accessor: 'startDate',
      render: (row) => (
        <div>
          <p>{formatDate(row.startDate)}</p>
          <p className="text-xs text-muted">au {formatDate(row.endDate)}</p>
        </div>
      ),
    },
    {
      header: 'Durée',
      accessor: 'units',
      render: (row) => formatUnits(row.units),
    },
    {
      header: 'Statut',
      accessor: 'status',
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={getLeaveStatusLabel(row.status)}
          tone={getLeaveStatusTone(row.status)}
          showDot={false}
        />
      ),
    },
    {
      header: 'Validateur',
      accessor: 'approver',
    },
  ];

  const handleCreateRequest = (event) => {
    event.preventDefault();
    if (!formValues.startDate || !formValues.endDate) {
      toast.info('Renseigne la date de début et la date de fin avant de soumettre.', {
        title: 'Dates requises',
      });
      return;
    }

    const leaveTypeLabel = filterOptions.leaveTypes.find((option) => option.value === formValues.leaveTypeCode)?.label || 'Congé';
    const createdRequest = {
      id: `local_${Date.now()}`,
      reference: `CG-2026-${String(requests.length + 1).padStart(3, '0')}`,
      employee: 'Moi',
      team: 'Mon équipe',
      leaveType: leaveTypeLabel,
      leaveTypeCode: formValues.leaveTypeCode,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      units: 1,
      status: 'SUBMITTED',
      approver: 'Manager direct',
      submittedAt: new Date().toISOString(),
      reason: formValues.reason || 'Demande soumise depuis le portail.',
      payTreatment: 'À confirmer',
    };

    setRequests((current) => [createdRequest, ...current]);
    setFormValues(INITIAL_FORM);
    setIsCreateOpen(false);
    toast.success(`${createdRequest.reference} a été transmise au circuit de validation.`, {
      title: 'Demande créée',
    });
  };

  const handleCancelRequest = (request) => {
    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? { ...item, status: 'CANCELLED', approver: 'Demande annulée' }
          : item,
      ),
    );
    toast.info(`${request.reference} a été annulée.`, {
      title: 'Demande annulée',
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="Mes demandes"
        subtitle="Suis tes demandes, prépare les pièces justificatives et crée une nouvelle absence."
        action={(
          <Button onClick={() => setIsCreateOpen(true)}>
            <FilePlus2 size={16} />
            Nouvelle demande
          </Button>
        )}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            label="Recherche"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Référence, type ou motif"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Statut</label>
            <DropdownSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={filterOptions.statuses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Type de congé</label>
            <DropdownSelect
              value={leaveTypeFilter}
              onChange={setLeaveTypeFilter}
              options={[{ value: 'all', label: 'Tous les types' }, ...(filterOptions.leaveTypes || [])]}
            />
          </div>
        </div>
      </Card>

      <DataTable
        title="Historique des demandes"
        description="Les statuts sont mis à jour au fil du workflow manager et RH."
        columns={columns}
        data={filteredRequests}
        emptyMessage="Aucune demande de congé trouvée."
        renderActions={(row) => (
          <DropdownAction
            label="Actions"
            items={[
              { id: 'view', label: 'Voir le détail', icon: Eye, onClick: () => setSelectedRequest(row) },
              {
                id: 'cancel',
                label: 'Annuler',
                icon: XCircle,
                variant: 'danger',
                disabled: ['APPROVED', 'REJECTED', 'CANCELLED'].includes(row.status),
                onClick: () => handleCancelRequest(row),
              },
            ]}
          />
        )}
      />

      <Sheet
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.reference || 'Détail de la demande'}
        description="Résumé métier, pièces et impact solde."
        size="md"
        footer={(
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setSelectedRequest(null)}>Fermer</Button>
          </div>
        )}
      >
        {selectedRequest ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Type</p>
                <p className="mt-1 font-medium text-text">{selectedRequest.leaveType}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Traitement paie</p>
                <p className="mt-1 font-medium text-text">{selectedRequest.payTreatment}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Période</p>
                <p className="mt-1 font-medium text-text">
                  {formatDate(selectedRequest.startDate)} au {formatDate(selectedRequest.endDate)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Statut</p>
                <div className="mt-2">
                  <StatusBadge
                    status={selectedRequest.status}
                    label={getLeaveStatusLabel(selectedRequest.status)}
                    tone={getLeaveStatusTone(selectedRequest.status)}
                    showDot={false}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Motif</p>
              <p className="mt-2 text-sm text-text">{selectedRequest.reason}</p>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle demande de congé"
        description="Prépare une demande conforme au workflow interne."
        size="md"
        footer={(
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
            <Button type="submit" form="leave-request-form">Soumettre</Button>
          </div>
        )}
      >
        <form id="leave-request-form" className="space-y-4" onSubmit={handleCreateRequest}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Type de congé</label>
            <DropdownSelect
              value={formValues.leaveTypeCode}
              onChange={(value) => setFormValues((current) => ({ ...current, leaveTypeCode: value }))}
              options={filterOptions.leaveTypes}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="date"
              label="Date de début"
              value={formValues.startDate}
              onChange={(event) => setFormValues((current) => ({ ...current, startDate: event.target.value }))}
            />
            <Input
              type="date"
              label="Date de fin"
              value={formValues.endDate}
              onChange={(event) => setFormValues((current) => ({ ...current, endDate: event.target.value }))}
            />
          </div>

          <Input
            label="Téléphone joignable"
            value={formValues.contactPhone}
            onChange={(event) => setFormValues((current) => ({ ...current, contactPhone: event.target.value }))}
            placeholder="Ex. +243 900 000 000"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text">Motif</label>
            <textarea
              value={formValues.reason}
              onChange={(event) => setFormValues((current) => ({ ...current, reason: event.target.value }))}
              rows={4}
              placeholder="Décris le motif de la demande et les éléments utiles pour la validation."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </form>
      </Sheet>
    </div>
  );
}

export default LeaveMyRequests;
